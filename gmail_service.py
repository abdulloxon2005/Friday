# -*- coding: utf-8 -*-
"""
F.R.I.D.A.Y. Gmail Service — Mukammallashtirilgan Ko'p Akkauntli Gmail Tizimi
1. Google OAuth 2.0 (Gmail API)
2. Gmail App Password (IMAP/SMTP SSL - 100% ishonchli va barqaror)
3. Background Monitoring & Ruhshonaga avtomatik javob tizimi
"""

import os
import sys
import io
import json
import base64
import threading
import time
import imaplib
import smtplib
import email
from email.header import decode_header, make_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

# Windows terminal uchun UTF-8 qo'llab-quvvatlash
if sys.stdout and hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')
TOKENS_DIR = os.path.join(BASE_DIR, 'tokens')
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
]

os.makedirs(TOKENS_DIR, exist_ok=True)


def _safe_email_name(email_addr):
    return email_addr.replace('@', '_at_').replace('.', '_')


def _decode_mime_header(header_value):
    """MIME sarlavhalarini (UTF-8, Base64, Cyrillic) xatosiz dekodlash."""
    if not header_value:
        return ''
    try:
        decoded = decode_header(header_value)
        parts = []
        for text, encoding in decoded:
            if isinstance(text, bytes):
                if encoding:
                    try:
                        parts.append(text.decode(encoding, errors='replace'))
                    except Exception:
                        parts.append(text.decode('utf-8', errors='replace'))
                else:
                    parts.append(text.decode('utf-8', errors='replace'))
            else:
                parts.append(str(text))
        return ''.join(parts)
    except Exception:
        return str(header_value)


# ============================================================
# 1. GmailImapAccount — App Password orqali IMAP/SMTP (100% Barqaror)
# ============================================================
class GmailImapAccount:
    """Gmail akkauntini IMAP (o'qish) va SMTP (yuborish) orqali boshqaradi."""

    def __init__(self, email_addr, app_password):
        self.email = email_addr.strip().lower()
        self.password = app_password.strip().replace(' ', '').replace('-', '')
        self.account_type = 'imap'
        self.last_seen_ids = set()

    def _get_imap(self):
        """IMAP SSL ulanishi."""
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993, timeout=12)
        mail.login(self.email, self.password)
        return mail

    def test_connection(self):
        """Ulanishni tekshirish."""
        try:
            mail = self._get_imap()
            mail.logout()
            return True, "Ulanish muvaffaqiyatli"
        except Exception as e:
            err = str(e)
            if 'AUTHENTICATIONFAILED' in err or 'Username and Password not accepted' in err:
                return False, "Google autentifikatsiyani rad etdi. Oddiy akkaunt paroli o'tmaydi. Google hisobingizdan (myaccount.google.com/apppasswords) 16-harfli Ilova paroli (App Password) oling."
            return False, f"Ulanishda xato: {err}"

    def get_inbox(self, max_results=20):
        """Inbox dagi oxirgi xabarlar."""
        detailed = []
        try:
            mail = self._get_imap()
            mail.select('INBOX')
            status, data = mail.search(None, 'ALL')
            if status != 'OK' or not data or not data[0]:
                mail.logout()
                return []

            msg_ids = data[0].split()
            recent_ids = msg_ids[-max_results:]
            recent_ids.reverse()

            for mid in recent_ids:
                try:
                    status, msg_data = mail.fetch(mid, '(BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)] FLAGS)')
                    if status != 'OK':
                        continue
                    
                    raw_header = b''
                    flags = ''
                    for item in msg_data:
                        if isinstance(item, tuple):
                            raw_header = item[1]
                        elif isinstance(item, bytes):
                            flags = item.decode('utf-8', errors='replace')

                    msg_obj = email.message_from_bytes(raw_header)
                    from_hdr = _decode_mime_header(msg_obj.get('From', ''))
                    to_hdr = _decode_mime_header(msg_obj.get('To', ''))
                    subj_hdr = _decode_mime_header(msg_obj.get('Subject', '(Mavzusiz)'))
                    date_hdr = msg_obj.get('Date', '')
                    is_unread = '\\Seen' not in flags

                    # Qisqa snippet olish
                    snippet = ''
                    try:
                        s_status, s_data = mail.fetch(mid, '(BODY.PEEK[TEXT]<0.200>)')
                        if s_status == 'OK' and s_data and isinstance(s_data[0], tuple):
                            snippet = s_data[0][1].decode('utf-8', errors='replace').strip()[:150]
                    except Exception:
                        pass

                    detailed.append({
                        'id': mid.decode('utf-8'),
                        'from': from_hdr,
                        'to': to_hdr,
                        'subject': subj_hdr,
                        'date': date_hdr,
                        'snippet': snippet,
                        'unread': is_unread,
                        'account': self.email
                    })
                except Exception as inner_e:
                    print(f"[{self.email}] Xabar #{mid} o'qishda xato: {inner_e}")

            mail.logout()
        except Exception as e:
            print(f"[{self.email}] IMAP Inbox xatosi: {e}")
        return detailed

    def get_unread(self, max_results=20):
        """Faqat o'qilmagan xabarlar."""
        detailed = []
        try:
            mail = self._get_imap()
            mail.select('INBOX')
            status, data = mail.search(None, 'UNSEEN')
            if status != 'OK' or not data or not data[0]:
                mail.logout()
                return []

            msg_ids = data[0].split()
            recent_ids = msg_ids[-max_results:]
            recent_ids.reverse()

            for mid in recent_ids:
                try:
                    status, msg_data = mail.fetch(mid, '(BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])')
                    if status != 'OK':
                        continue
                    raw_header = msg_data[0][1] if isinstance(msg_data[0], tuple) else b''
                    msg_obj = email.message_from_bytes(raw_header)

                    detailed.append({
                        'id': mid.decode('utf-8'),
                        'from': _decode_mime_header(msg_obj.get('From', '')),
                        'to': _decode_mime_header(msg_obj.get('To', '')),
                        'subject': _decode_mime_header(msg_obj.get('Subject', '(Mavzusiz)')),
                        'date': msg_obj.get('Date', ''),
                        'snippet': '',
                        'unread': True,
                        'account': self.email
                    })
                except Exception:
                    pass
            mail.logout()
        except Exception as e:
            print(f"[{self.email}] IMAP unread xatosi: {e}")
        return detailed

    def get_message_body(self, msg_id):
        """Xabar to'liq matni."""
        try:
            mail = self._get_imap()
            mail.select('INBOX')
            status, data = mail.fetch(msg_id.encode('utf-8'), '(RFC822)')
            mail.logout()
            if status != 'OK' or not data or not data[0] or not isinstance(data[0], tuple):
                return ''
            
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)
            body = ''
            if msg.is_multipart():
                for part in msg.walk():
                    ctype = part.get_content_type()
                    cdispo = str(part.get('Content-Disposition'))
                    if ctype == 'text/plain' and 'attachment' not in cdispo:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', errors='replace')
                            break
                    elif ctype == 'text/html' and not body and 'attachment' not in cdispo:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', errors='replace')
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode('utf-8', errors='replace')
            return body
        except Exception as e:
            print(f"[{self.email}] Body xatosi: {e}")
            return ''

    def send_email(self, to, subject, body_text):
        """Gmail SMTP orqali haqiqiy xat yuborish."""
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Friday AI ({self.email})"
            msg['To'] = to
            msg['Subject'] = subject
            msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

            # Port 465 SSL
            with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=15) as server:
                server.login(self.email, self.password)
                server.sendmail(self.email, [to], msg.as_string())

            print(f"[{self.email}] [+] Real xabar yuborildi: {to}")
            return {'success': True, 'message_id': f"smtp_{int(time.time())}"}
        except Exception as e:
            print(f"[{self.email}] [-] SMTP xabar yuborishda xato: {e}")
            return {'success': False, 'error': str(e)}

    def check_new_messages(self):
        """Yangi xabarlarni tekshirish."""
        new_messages = []
        try:
            mail = self._get_imap()
            mail.select('INBOX')
            status, data = mail.search(None, 'UNSEEN')
            if status != 'OK' or not data or not data[0]:
                mail.logout()
                return []

            current_ids = set(data[0].split())
            if not self.last_seen_ids:
                self.last_seen_ids = current_ids
                mail.logout()
                return []

            new_ids = current_ids - self.last_seen_ids
            self.last_seen_ids = current_ids

            for mid in new_ids:
                try:
                    status, msg_data = mail.fetch(mid, '(BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])')
                    if status == 'OK' and msg_data and isinstance(msg_data[0], tuple):
                        msg_obj = email.message_from_bytes(msg_data[0][1])
                        new_messages.append({
                            'id': mid.decode('utf-8'),
                            'from': _decode_mime_header(msg_obj.get('From', '')),
                            'to': _decode_mime_header(msg_obj.get('To', '')),
                            'subject': _decode_mime_header(msg_obj.get('Subject', '(Mavzusiz)')),
                            'date': msg_obj.get('Date', ''),
                            'unread': True,
                            'account': self.email
                        })
                except Exception:
                    pass
            mail.logout()
        except Exception as e:
            print(f"[{self.email}] Check new xato: {e}")
        return new_messages

    def mark_as_read(self, msg_id):
        """Xabarni o'qilgan deb belgilash."""
        try:
            mail = self._get_imap()
            mail.select('INBOX')
            mail.store(msg_id.encode('utf-8'), '+FLAGS', '\\Seen')
            mail.logout()
            return True
        except Exception as e:
            print(f"[{self.email}] Mark as read xato: {e}")
            return False


# ============================================================
# 2. GmailOAuthAccount — Google OAuth 2.0 orqali
# ============================================================
class GmailOAuthAccount:
    """Gmail API orqali ishlovchi OAuth akkaunt."""

    def __init__(self, email_addr, creds: Credentials):
        self.email = email_addr
        self.creds = creds
        self.account_type = 'oauth'
        self.service = build('gmail', 'v1', credentials=creds)
        self.last_seen_ids = set()

    def _refresh_if_needed(self):
        if self.creds and self.creds.expired and self.creds.refresh_token:
            self.creds.refresh(Request())
            path = os.path.join(TOKENS_DIR, f'oauth_{_safe_email_name(self.email)}.json')
            with open(path, 'w') as f:
                f.write(self.creds.to_json())
            self.service = build('gmail', 'v1', credentials=self.creds)

    def get_inbox(self, max_results=20):
        self._refresh_if_needed()
        try:
            results = self.service.users().messages().list(
                userId='me', labelIds=['INBOX'], maxResults=max_results
            ).execute()
            messages = results.get('messages', [])
            detailed = []
            for msg in messages:
                detail = self._get_message_detail(msg['id'])
                if detail:
                    detailed.append(detail)
            return detailed
        except Exception as e:
            print(f"[{self.email}] OAuth inbox xato: {e}")
            return []

    def get_unread(self, max_results=20):
        self._refresh_if_needed()
        try:
            results = self.service.users().messages().list(
                userId='me', labelIds=['INBOX', 'UNREAD'], maxResults=max_results
            ).execute()
            messages = results.get('messages', [])
            detailed = []
            for msg in messages:
                detail = self._get_message_detail(msg['id'])
                if detail:
                    detailed.append(detail)
            return detailed
        except Exception as e:
            print(f"[{self.email}] OAuth unread xato: {e}")
            return []

    def _get_message_detail(self, msg_id):
        try:
            msg = self.service.users().messages().get(
                userId='me', id=msg_id, format='metadata',
                metadataHeaders=['From', 'To', 'Subject', 'Date']
            ).execute()
            headers = {h['name']: h['value'] for h in msg.get('payload', {}).get('headers', [])}
            labels = msg.get('labelIds', [])
            return {
                'id': msg_id,
                'from': _decode_mime_header(headers.get('From', 'Noma\'lum')),
                'to': headers.get('To', ''),
                'subject': _decode_mime_header(headers.get('Subject', '(Mavzusiz)')),
                'date': headers.get('Date', ''),
                'snippet': msg.get('snippet', ''),
                'unread': 'UNREAD' in labels,
                'account': self.email
            }
        except Exception:
            return None

    def get_message_body(self, msg_id):
        self._refresh_if_needed()
        try:
            msg = self.service.users().messages().get(userId='me', id=msg_id, format='full').execute()
            return self._extract_body(msg.get('payload', {}))
        except Exception:
            return ''

    def _extract_body(self, payload):
        if 'body' in payload and payload['body'].get('data'):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='replace')
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('mimeType') == 'text/plain' and part.get('body', {}).get('data'):
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='replace')
            for part in payload['parts']:
                if part.get('mimeType') == 'text/html' and part.get('body', {}).get('data'):
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='replace')
        return ''

    def send_email(self, to, subject, body_text):
        self._refresh_if_needed()
        try:
            message = MIMEMultipart()
            message['to'] = to
            message['from'] = self.email
            message['subject'] = subject
            message.attach(MIMEText(body_text, 'plain', 'utf-8'))
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            res = self.service.users().messages().send(userId='me', body={'raw': raw}).execute()
            return {'success': True, 'message_id': res.get('id')}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def check_new_messages(self):
        self._refresh_if_needed()
        try:
            results = self.service.users().messages().list(userId='me', labelIds=['INBOX', 'UNREAD'], maxResults=10).execute()
            messages = results.get('messages', [])
            current_ids = {m['id'] for m in messages}
            if not self.last_seen_ids:
                self.last_seen_ids = current_ids
                return []
            new_ids = current_ids - self.last_seen_ids
            self.last_seen_ids = current_ids
            return [self._get_message_detail(mid) for mid in new_ids if self._get_message_detail(mid)]
        except Exception:
            return []

    def mark_as_read(self, msg_id):
        self._refresh_if_needed()
        try:
            self.service.users().messages().modify(userId='me', id=msg_id, body={'removeLabelIds': ['UNREAD']}).execute()
            return True
        except Exception:
            return False


# ============================================================
# 3. AccountManager — Ko'p Akkauntli Boshqaruvchi
# ============================================================
class AccountManager:
    """Barcha ulangan Gmail akkauntlarini birlashtirib boshqaradi."""

    def __init__(self):
        self.accounts = {}  # email -> GmailImapAccount yoki GmailOAuthAccount
        self.new_messages_buffer = []
        self.auto_reply_log = []
        self._monitor_running = False
        self._monitor_thread = None
        self._load_saved_accounts()

    def _load_saved_accounts(self):
        """Saqlangan barcha akkauntlarni (OAuth & IMAP) yuklash."""
        if not os.path.exists(TOKENS_DIR):
            return
        
        for fname in os.listdir(TOKENS_DIR):
            fpath = os.path.join(TOKENS_DIR, fname)
            
            # 1. IMAP akkauntlar
            if fname.startswith('imap_') and fname.endswith('.json'):
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    acc = GmailImapAccount(data['email'], data['password'])
                    self.accounts[acc.email] = acc
                    print(f"[+] IMAP akkaunt yuklandi: {acc.email}")
                except Exception as e:
                    print(f"[-] IMAP yuklashda xato ({fname}): {e}")

            # 2. OAuth akkauntlar
            elif (fname.startswith('oauth_') or fname.startswith('token_')) and fname.endswith('.json'):
                try:
                    creds = Credentials.from_authorized_user_file(fpath, SCOPES)
                    if creds and creds.valid:
                        service = build('gmail', 'v1', credentials=creds)
                        profile = service.users().getProfile(userId='me').execute()
                        email_addr = profile['emailAddress']
                        self.accounts[email_addr] = GmailOAuthAccount(email_addr, creds)
                        print(f"[+] OAuth akkaunt yuklandi: {email_addr}")
                    elif creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                        with open(fpath, 'w') as f:
                            f.write(creds.to_json())
                        service = build('gmail', 'v1', credentials=creds)
                        profile = service.users().getProfile(userId='me').execute()
                        email_addr = profile['emailAddress']
                        self.accounts[email_addr] = GmailOAuthAccount(email_addr, creds)
                        print(f"[+] OAuth akkaunt yangilandi: {email_addr}")
                except Exception as e:
                    print(f"[-] OAuth yuklashda xato ({fname}): {e}")

    # --- IMAP Akkaunt Qo'shish ---
    def add_imap_account(self, email_addr, app_password):
        """Gmail Ilova paroli orqali tezkor va 100% ishonchli ulash."""
        account = GmailImapAccount(email_addr, app_password)
        ok, msg = account.test_connection()
        if not ok:
            return False, msg

        # Saqlash
        fpath = os.path.join(TOKENS_DIR, f'imap_{_safe_email_name(account.email)}.json')
        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump({'email': account.email, 'password': account.password}, f, indent=2)

        self.accounts[account.email] = account
        print(f"[+] Yangi IMAP akkaunt ulandi: {account.email}")
        return True, account.email

    # --- OAuth Flow ---
    def create_auth_flow(self):
        flow = Flow.from_client_secrets_file(
            CREDENTIALS_FILE, scopes=SCOPES,
            redirect_uri='http://localhost:5000/api/auth/callback'
        )
        auth_url, state = flow.authorization_url(
            access_type='offline', include_granted_scopes='true', prompt='consent'
        )
        return auth_url, state, flow

    def complete_auth(self, flow, code):
        flow.fetch_token(code=code)
        creds = flow.credentials
        service = build('gmail', 'v1', credentials=creds)
        profile = service.users().getProfile(userId='me').execute()
        email_addr = profile['emailAddress']

        fpath = os.path.join(TOKENS_DIR, f'oauth_{_safe_email_name(email_addr)}.json')
        with open(fpath, 'w') as f:
            f.write(creds.to_json())

        acc = GmailOAuthAccount(email_addr, creds)
        self.accounts[email_addr] = acc
        print(f"[+] Yangi OAuth akkaunt ulandi: {email_addr}")
        return email_addr

    # --- Akkaunt O'chirish ---
    def remove_account(self, email_addr):
        email_clean = email_addr.strip().lower()
        if email_clean in self.accounts:
            del self.accounts[email_clean]
            # Fayllarni tozalash
            for prefix in ['imap_', 'oauth_', 'token_']:
                fpath = os.path.join(TOKENS_DIR, f'{prefix}{_safe_email_name(email_clean)}.json')
                if os.path.exists(fpath):
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass
            print(f"[-] Akkaunt o'chirildi: {email_clean}")
            return True
        return False

    def list_accounts(self):
        result = []
        for email_addr, acc in self.accounts.items():
            try:
                unread = acc.get_unread(max_results=50)
                result.append({
                    'email': email_addr,
                    'type': getattr(acc, 'account_type', 'standard'),
                    'unread_count': len(unread),
                    'status': 'active'
                })
            except Exception:
                result.append({
                    'email': email_addr,
                    'type': getattr(acc, 'account_type', 'standard'),
                    'unread_count': 0,
                    'status': 'error'
                })
        return result

    # --- Inbox va Xabarlar ---
    def get_all_inbox(self, max_per_account=15):
        all_messages = []
        for email_addr, acc in self.accounts.items():
            msgs = acc.get_inbox(max_results=max_per_account)
            all_messages.extend(msgs)
        all_messages.sort(key=lambda m: m.get('date', ''), reverse=True)
        return all_messages

    def get_inbox(self, email_addr, max_results=20):
        acc = self.accounts.get(email_addr.strip().lower())
        if acc:
            return acc.get_inbox(max_results)
        return []

    def send_email(self, from_email, to_email, subject, body):
        target_acc = None
        if from_email and from_email.strip().lower() in self.accounts:
            target_acc = self.accounts[from_email.strip().lower()]
        elif self.accounts:
            target_acc = list(self.accounts.values())[0]

        if target_acc:
            res = target_acc.send_email(to_email, subject, body)
            if res.get('success'):
                res['from'] = target_acc.email
            return res
        return {'success': False, 'error': 'Hech qanday Gmail akkaunt ulanmagan. Iltimos, avval akkaunt ulang.'}

    # --- Hisobot ---
    def generate_report(self):
        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'accounts': [],
            'total_unread': 0
        }
        for email_addr, acc in self.accounts.items():
            try:
                unread = acc.get_unread(max_results=50)
                inbox = acc.get_inbox(max_results=5)
                report['accounts'].append({
                    'email': email_addr,
                    'unread_count': len(unread),
                    'latest': inbox[:3],
                    'status': 'active'
                })
                report['total_unread'] += len(unread)
            except Exception as e:
                report['accounts'].append({
                    'email': email_addr,
                    'unread_count': 0,
                    'latest': [],
                    'status': f'error: {e}'
                })
        return report

    # --- Monitoring & Ruhshona Rule ---
    def start_monitor(self, interval=60):
        if self._monitor_running:
            return
        self._monitor_running = True
        self._monitor_thread = threading.Thread(target=self._monitor_loop, args=(interval,), daemon=True)
        self._monitor_thread.start()
        print(f"[+] Monitoring faollashtirildi (har {interval}s)")

    def stop_monitor(self):
        self._monitor_running = False

    def _monitor_loop(self, interval):
        while self._monitor_running:
            for email_addr, acc in list(self.accounts.items()):
                try:
                    new_msgs = acc.check_new_messages()
                    for msg in new_msgs:
                        self.new_messages_buffer.append(msg)
                        print(f"[!] Yangi xabar: [{email_addr}] {msg.get('from')} -- {msg.get('subject')}")
                        self._check_ruhshona_rule(acc, msg)
                except Exception as e:
                    print(f"[-] Monitor xatosi [{email_addr}]: {e}")
            time.sleep(interval)

    def _check_ruhshona_rule(self, account, message):
        """Ruhshonadan kelgan xabarga avtomatik javob berish."""
        sender = (message.get('from') or '').lower()
        subject = (message.get('subject') or '').lower()
        
        # Ruhshona identifikatsiyasi
        is_ruhshona = (
            'ruhshona' in sender or
            'ruxshona' in sender or
            'rukhshona' in sender or
            'nishonovaruhshonaxon' in sender or
            'ism:ruhshona' in subject or
            'ism: ruhshona' in subject
        )

        if is_ruhshona:
            from_email = message.get('from', '')
            if '<' in from_email and '>' in from_email:
                reply_to = from_email.split('<')[1].split('>')[0].strip()
            else:
                reply_to = from_email.strip()

            reply_body = "Salom boshliq ruxsat bergan inson! Friday sizning xizmatingizda. Nima yordam bera olaman?"
            reply_subject = f"Re: {message.get('subject', 'Javob')}"

            res = account.send_email(reply_to, reply_subject, reply_body)
            log_item = {
                'time': datetime.now(timezone.utc).isoformat(),
                'from': from_email,
                'to': reply_to,
                'account': account.email,
                'subject': message.get('subject'),
                'auto_reply_sent': res.get('success', False)
            }
            self.auto_reply_log.append(log_item)
            if res.get('success'):
                print(f"[+] Ruhshonaga avtomatik javob yuborildi: {reply_to}")
            else:
                print(f"[-] Ruhshonaga javob yuborishda xato: {res.get('error')}")

    def get_new_messages(self):
        msgs = list(self.new_messages_buffer)
        self.new_messages_buffer.clear()
        return msgs

    def get_auto_reply_log(self):
        return list(self.auto_reply_log)

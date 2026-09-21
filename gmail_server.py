# -*- coding: utf-8 -*-
"""
F.R.I.D.A.Y. Gmail Backend Server — Flask API
Ko'p akkauntli Gmail boshqaruv tizimi (IMAP App Password + OAuth2).
"""

import os
import sys
import io
import json
from flask import Flask, request, jsonify, redirect, send_from_directory
from flask_cors import CORS
from gmail_service import AccountManager

# Windows terminal UTF-8
if sys.stdout and hasattr(sys.stdout, 'buffer'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

def _load_local_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_local_env()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

manager = AccountManager()
_pending_flows = {}

# ============================================================
# STATIC FILES
# ============================================================
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    if os.path.exists(os.path.join('.', filename)):
        return send_from_directory('.', filename)
    return send_from_directory('.', 'index.html')

# ============================================================
# AUTH & ACCOUNT APIS
# ============================================================
@app.route('/api/auth/status')
def auth_status():
    accounts = manager.list_accounts()
    return jsonify({
        'authenticated': len(accounts) > 0,
        'accounts_count': len(accounts),
        'accounts': accounts
    })

@app.route('/api/accounts', methods=['GET'])
def list_accounts():
    accounts = manager.list_accounts()
    return jsonify({'accounts': accounts})

@app.route('/api/accounts/add-app-password', methods=['POST'])
def add_app_password():
    """Gmail Ilova paroli (App Password) orqali tezkor va xatosiz ulash."""
    data = request.get_json() or {}
    email_addr = data.get('email', '').strip()
    password = data.get('app_password', '').strip()

    if not email_addr or not password:
        return jsonify({'success': False, 'error': 'Email va Ilova paroli kiritilishi shart'}), 400

    ok, msg = manager.add_imap_account(email_addr, password)
    if ok:
        return jsonify({'success': True, 'email': msg, 'message': f'{msg} muvaffaqiyatli ulandi'})
    return jsonify({'success': False, 'error': msg}), 400

@app.route('/api/accounts/add', methods=['GET'])
def add_account_oauth():
    """OAuth 2.0 orqali ulash."""
    try:
        auth_url, state, flow = manager.create_auth_flow()
        _pending_flows[state] = flow
        return jsonify({'auth_url': auth_url, 'state': state})
    except Exception as e:
        return jsonify({'error': f'OAuth boshlashda xato: {str(e)}'}), 500

@app.route('/api/auth/callback')
def auth_callback():
    err = request.args.get('error')
    if err:
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Friday — Google 403 Xatosi</title>
            <style>
                body {{ background: #000; color: #ff3366; font-family: monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }}
                .card {{ background: rgba(20, 5, 10, 0.95); border: 2px solid #ff3366; border-radius: 8px; padding: 30px; text-align: center; max-width: 520px; box-shadow: 0 0 30px rgba(255, 51, 102, 0.4); }}
                h2 {{ color: #ff5e78; margin-bottom: 12px; }}
                p {{ color: #e0e0e0; font-size: 0.9rem; line-height: 1.5; }}
                .btn {{ background: rgba(0, 255, 65, 0.2); border: 1px solid #00ff41; color: #00ff41; padding: 10px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 15px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h2>⚠️ Google OAuth 403: {err}</h2>
                <p>Google hisobingiz loyihaning "Test users" ro'yxatiga qo'shilmagan.</p>
                <p><strong>Tavsiya:</strong> 403 xatosini chetlab o'tish uchun Friday'dagi <strong>"Ilova paroli (App Password)"</strong> orqali 100% xatosiz ulaning!</p>
                <a href="/" class="btn">🏠 Friday'ga Qaytish</a>
            </div>
        </body>
        </html>
        ''', 403

    code = request.args.get('code')
    state = request.args.get('state')

    if not code:
        return '<h2>❌ Xato: Authorization code topilmadi</h2>', 400

    flow = _pending_flows.get(state)
    if not flow:
        try:
            from gmail_service import CREDENTIALS_FILE, SCOPES
            from google_auth_oauthlib.flow import Flow as OAuthFlow
            flow = OAuthFlow.from_client_secrets_file(
                CREDENTIALS_FILE, scopes=SCOPES,
                redirect_uri='http://localhost:5000/api/auth/callback'
            )
        except Exception as e:
            return f'<h2>❌ Flow xatosi: {e}</h2>', 500

    try:
        email_addr = manager.complete_auth(flow, code)
        if state in _pending_flows:
            del _pending_flows[state]

        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Friday — Gmail Ulandi!</title>
            <style>
                body {{ background: #000000; color: #00ff41; font-family: monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }}
                .card {{ background: rgba(2, 18, 6, 0.95); border: 2px solid #00ff41; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 0 30px rgba(0, 255, 65, 0.4); max-width: 500px; }}
                h1 {{ color: #39ff14; margin-bottom: 10px; }}
                .email {{ color: #ffffff; font-size: 1.2rem; font-weight: bold; background: rgba(0,255,65,0.15); padding: 6px 12px; border-radius: 4px; display: inline-block; }}
                .btn {{ background: rgba(0, 255, 65, 0.2); border: 1px solid #00ff41; color: #fff; padding: 12px 30px; border-radius: 4px; font-size: 0.95rem; cursor: pointer; margin-top: 20px; text-decoration: none; display: inline-block; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>✅ Gmail Muvaffaqiyatli Ulandi!</h1>
                <p class="email">{email_addr}</p>
                <p>Friday endi bu pochtani doimiy monitoring va kuzatuvga oldi, boshliq!</p>
                <a href="/" class="btn">🏠 Friday'ga Qaytish</a>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{ type: 'gmail_auth_complete', email: '{email_addr}' }}, '*');
                    setTimeout(() => window.close(), 2000);
                }}
            </script>
        </body>
        </html>
        '''
    except Exception as e:
        return f'<h2>❌ Autentifikatsiya xatosi: {e}</h2>', 500

@app.route('/api/accounts/<path:email_addr>', methods=['DELETE'])
def remove_account(email_addr):
    success = manager.remove_account(email_addr)
    if success:
        return jsonify({'success': True, 'message': f'{email_addr} o\'chirildi'})
    return jsonify({'success': False, 'error': 'Akkaunt topilmadi'}), 404

# ============================================================
# INBOX & MESSAGES
# ============================================================
@app.route('/api/inbox/all')
def all_inbox():
    max_per = request.args.get('max', 15, type=int)
    messages = manager.get_all_inbox(max_per_account=max_per)
    return jsonify({'messages': messages, 'total': len(messages)})

@app.route('/api/inbox/<path:email_addr>')
def account_inbox(email_addr):
    max_results = request.args.get('max', 20, type=int)
    messages = manager.get_inbox(email_addr, max_results=max_results)
    return jsonify({'messages': messages, 'total': len(messages), 'account': email_addr})

@app.route('/api/message/<path:email_addr>/<msg_id>')
def message_detail(email_addr, msg_id):
    acc = manager.accounts.get(email_addr.strip().lower())
    if not acc:
        return jsonify({'error': 'Akkaunt topilmadi'}), 404
    body = acc.get_message_body(msg_id)
    return jsonify({'body': body, 'account': email_addr, 'id': msg_id})

@app.route('/api/message/<path:email_addr>/<msg_id>/read', methods=['POST'])
def mark_read(email_addr, msg_id):
    acc = manager.accounts.get(email_addr.strip().lower())
    if not acc:
        return jsonify({'error': 'Akkaunt topilmadi'}), 404
    success = acc.mark_as_read(msg_id)
    return jsonify({'success': success})

# ============================================================
# SEND EMAIL
# ============================================================
@app.route('/api/send', methods=['POST'])
def send_email():
    data = request.get_json() or {}
    to_email = data.get('to', '').strip()
    subject = data.get('subject', 'Friday AI orqali xabar').strip()
    body = data.get('body', '').strip()
    from_email = data.get('from', '').strip()

    if not to_email:
        return jsonify({'success': False, 'error': 'Qabul qiluvchi email (to) kiritilmagan'}), 400
    if not body:
        return jsonify({'success': False, 'error': 'Xabar matni (body) bo\'sh bo\'lishi mumkin emas'}), 400

    result = manager.send_email(from_email, to_email, subject, body)
    if result.get('success'):
        return jsonify(result)
    return jsonify({'success': False, 'error': result.get('error', 'Xabar yuborishda noma\'lum xato')}), 500

# ============================================================
# MONITORING & REPORT
# ============================================================
@app.route('/api/check-new')
def check_new():
    new_msgs = manager.get_new_messages()
    auto_replies = manager.get_auto_reply_log()
    return jsonify({
        'new_messages': new_msgs,
        'new_count': len(new_msgs),
        'auto_replies': auto_replies[-5:]
    })

@app.route('/api/config', methods=['GET'])
def get_system_config():
    """Tizim konfiguratsiyasini xavfsiz uzatish."""
    api_key = os.environ.get('GEMINI_API_KEY', '')
    return jsonify({
        'status': 'ok',
        'has_gemini_key': bool(api_key),
        'gemini_api_key': api_key
    })

@app.route('/api/report')
def report():
    report_data = manager.generate_report()
    return jsonify(report_data)

# ============================================================
# RUN SERVER & MONITORING
# ============================================================
manager.start_monitor(interval=60)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    print("=" * 60)
    print(f"[*] F.R.I.D.A.Y. Cyber AI Server (Active on {host}:{port})")
    print("=" * 60)

    accounts = manager.list_accounts()
    if accounts:
        print(f"[+] Ulangan akkauntlar ({len(accounts)}):")
        for acc in accounts:
            print(f"    - {acc['email']} [{acc.get('type','std')}] -- {acc['unread_count']} o'qilmagan")
    else:
        print("[!] Hech qanday Gmail akkaunt ulanmagan.")
        print(f"    Brauzerda http://localhost:{port} ochib, akkaunt ulang.")

    print("=" * 60)
    print(f"[+] Server manzil: http://{host}:{port}")
    print("=" * 60)

    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    app.run(host=host, port=port, debug=False)

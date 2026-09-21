# 🌐 F.R.I.D.A.Y. Kiber Tizimini Serverga Joylash Yo'riqnomasi

Ushbu qo'llanma orqali Friday tizimini istalgan Linux VPS (Ubuntu, Debian), Docker yoki bulutli serverlarga bir necha daqiqada muammosiz joylashingiz mumkin.

---

## ⚡ 1-USUL: Docker orqali ishga tushirish (Eng osoni)

Agar serveringizda **Docker** va **Docker Compose** o'rnatilgan bo'lsa:

1. Fayllarni serverga nusxalang yoki yuklang.
2. Loyiha papkasida quyidagi buyruqni bering:
   ```bash
   docker compose up -d --build
   ```
3. Bo'ldi! Tizim orqa fonda ishga tushadi:
   👉 Manzil: `http://SERVER_IP_MANZILI:5000`

---

## 🚀 2-USUL: Linux VPS (Ubuntu / Debian) — 1 ta buyruq bilan

Agar yangi VPS (Ubuntu 20.04 / 22.04 / 24.04) olgan bo'lsangiz:

1. Serverga SSH orqali kiring.
2. Fayllarni serverga yuklang (masalan, `/var/www/friday` papkasiga).
3. Avtomatik o'rnatish skriptini ishga tushiring:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
4. Skript barcha kerakli Python kutubxonalari, Gunicorn, xavfsizlik devori va tizim xizmatini (`systemd`) o'zi sozlab ishga tushiradi!

### Foydali server buyruqlari:
- **Server holatini ko'rish:** `sudo systemctl status friday`
- **Serverni qayta ishga tushirish:** `sudo systemctl restart friday`
- **Serverni to'xtatish:** `sudo systemctl stop friday`
- **Jonli loglarni ko'rish:** `sudo journalctl -u friday -f`

---

## ☁️ 3-USUL: Bepul Bulutli Platformalarga Joylash (Render / Railway)

Agar VPS sotib olmasdan bepul joylamoqchi bo'lsangiz:

### Render.com orqali:
1. Loyihani GitHub reponizga yuklang (`git push`).
2. [Render.com](https://render.com) ga kiring va **"New Web Service"** tugmasini bosing.
3. GitHub reponi tanlang.
4. Quyidagi sozlamalarni kiriting:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT gmail_server:app`
5. **"Deploy Web Service"** ni bosing. Render sizga bepul `https://friday-xxxx.onrender.com` domenini beradi!

---

## 🔒 4-QADAM: Domen va Bepul SSL (HTTPS) Ulash

Agar shaxsiy domeningiz bo'lsa (masalan: `friday.uz`):

1. `nginx.conf` faylini Nginx konfiguratsiyasiga nusxalang:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/friday
   sudo ln -s /etc/nginx/sites-available/friday /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
2. Bepul SSL sertifikati (Certbot) oling:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d sizning-domeningiz.uz
   ```
3. Endi Friday tizimingiz xavfsiz **`https://`** protokoli orqali ishlaydi!

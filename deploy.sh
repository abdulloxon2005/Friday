#!/bin/bash
# ========================================================
# F.R.I.D.A.Y. Cyber AI Assistant - Avtomatik O'rnatish Skripti
# Ubuntu 20.04 / 22.04 / 24.04 & Debian VPS uchun
# ========================================================

set -e

echo "========================================================"
echo "🚀 FRIDAY CYBER AI TIZIMINI SERVERGA O'RNATISH BOSHLANDI"
echo "========================================================"

# 1. Tizim paketlarini yangilash
echo "[1/5] Tizim paketlari yangilanmoqda..."
sudo apt update -y
sudo apt install -y python3 python3-pip python3-venv git curl ufw

# 2. Virtual muhit va kutubxonalar
echo "[2/5] Python kutubxonalari o'rnatilmoqda..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Papka va ruxsatlar
echo "[3/5] Tokenlar papkasi sozlanmoqda..."
mkdir -p tokens
chmod 755 tokens

# 4. Fayervol (Port 5000 va 80 ni ochish)
echo "[4/5] Fayervol portlari tekshirilmoqda..."
sudo ufw allow 5000/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true

# 5. Systemd xizmatini yoqish
echo "[5/5] Friday tizim xizmati (systemd) sozlanmoqda..."
CURRENT_DIR=$(pwd)
SERVICE_FILE="/etc/systemd/system/friday.service"

sudo bash -c "cat > $SERVICE_FILE" <<EOL
[Unit]
Description=FRIDAY Cyber AI Assistant
After=network.target

[Service]
User=$USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$CURRENT_DIR/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 2 --threads 4 gmail_server:app
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1
Environment=PORT=5000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl daemon-reload
sudo systemctl enable friday
sudo systemctl restart friday

echo "========================================================"
echo "✅ FRIDAY SERVERDA MUVAFFAQIYATLI ISHGA TUSHDI!"
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo "🌐 Kirish manzili: http://$SERVER_IP:5000"
echo "📊 Holatni tekshirish: sudo systemctl status friday"
echo "📜 Loglarni ko'rish: sudo journalctl -u friday -f"
echo "========================================================"

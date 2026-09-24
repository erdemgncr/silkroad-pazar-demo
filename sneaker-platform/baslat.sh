#!/usr/bin/env bash
# SneakerOS'u tek komutla başlatır (macOS / Linux). Çift tıklamak için: baslat.command
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. https://nodejs.org adresinden LTS sürümünü kurun."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "[1/3] Paketler yükleniyor (ilk seferde birkaç dakika sürer)..."
  npm install --no-audit --no-fund || exit 1
fi
if [ ! -d .data/db ]; then
  echo "[2/3] Veritabanı ve demo mağazalar hazırlanıyor..."
  npm run setup || exit 1
fi
echo "[3/3] Uygulama başlatılıyor: http://localhost:3000/panel"
echo "  Süper admin: admin@sneaker.local / admin12345"
echo "  Satıcı:      satici@sneaker.local / satici12345"
( sleep 10; (command -v open >/dev/null && open http://localhost:3000/panel) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000/panel) ) >/dev/null 2>&1 &
npm run dev

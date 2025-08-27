#!/bin/bash
clear

# --- PARAMETRLƏR ---
PROCESS_NAME="whatscore-ai"
PORT_TO_CLEAN="9876"
# Dynamic lock file path removed; will search for SingletonLock files instead
LOCK_FILE_PATH=""

# --- Chromium Detection ---
# If PUPPETEER_EXECUTABLE_PATH is not set, try to auto-detect
if [ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ]; then
    if command -v chromium >/dev/null 2>&1; then
        export PUPPETEER_EXECUTABLE_PATH=$(command -v chromium)
    elif command -v chromium-browser >/dev/null 2>&1; then
        export PUPPETEER_EXECUTABLE_PATH=$(command -v chromium-browser)
    fi
fi

echo "💣 Bütün köhnə prosesləri və qalıqları məhv edirəm (GOD MODE)..."
echo ""

# --- Addım 1: PM2 prosesini dayandırıb silmək ---
echo "[1/5] 🔥 PM2 prosesi dayandırılır: $PROCESS_NAME"
pm2 stop "$PROCESS_NAME" > /dev/null 2>&1
pm2 delete "$PROCESS_NAME" > /dev/null 2>&1
echo "      ✅ PM2 prosesi təmizləndi."
echo ""

# --- Addım 2: Zombi Chromium proseslərini öldürmək ---
echo "[2/5] 🔥 Zombi Chromium prosesləri öldürülür..."
pkill -f "chromium"
echo "      ✅ Zombi Chromium prosesləri təmizləndi."
echo ""

# --- Addım 3: Portu işğal edən prosesi öldürmək (YENİ VƏ KRİTİK) ---
echo "[3/5] 🔥 $PORT_TO_CLEAN nömrəli portu yoxlayıram..."
# lsof -t -i:$PORT -> portu istifadə edən prosesin ID-sini (PID) tapır
# kill -9 ...      -> həmin PID-i məcburi öldürür
if lsof -t -i:$PORT_TO_CLEAN > /dev/null; then
    echo "      ⚠️ Port $PORT_TO_CLEAN işğal edilib. Proses məcburi dayandırılır..."
    kill -9 $(lsof -t -i:$PORT_TO_CLEAN)
    echo "      ✅ Port $PORT_TO_CLEAN azad edildi."
else
    echo "      ✅ Port $PORT_TO_CLEAN onsuz da təmizdir."
fi
echo ""

# --- Addım 4: Kilid faylını silmək ---
echo "[4/5] 🔥 SingletonLock faylları axtarılır və təmizlənir..."
found=0
for lockfile in $(find "$HOME" -type f -name 'SingletonLock' 2>/dev/null); do
    found=1
    echo "      ⚠️ Lock faylı tapıldı: $lockfile. Silinir..."
    rm -f "$lockfile"
done
if [ "$found" -eq 0 ]; then
    echo "      ✅ Kilid faylları aşkar edilmədi."
else
    echo "      ✅ Bütün kilid faylları silindi."
fi
echo ""

# --- Addım 4.5: Lazımi qovluqların yaradılması ---
echo "[4.5/5] 📁 Lazımi qovluqlar yaradılır..."
mkdir -p .wwebjs_auth sessions logs media
echo "      ✅ Qovluqlar hazırdır."
echo ""

# --- Addım 5: Təmiz Başlanğıc ---
echo "[5/5] 🚀 Təmiz bir vərəqdən yeni proses yaradılır..."
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
pm2 start index.js --name "$PROCESS_NAME" --max-memory-restart 2G --node-args="--max-old-space-size=4096"
echo ""
sleep 2 # PM2-yə və sistemə nəfəs almaq üçün vaxt veririk

# --- Yekun Status ---
echo "----------------------------------------------------"
echo "✅ Proses PM2 tərəfindən uğurla idarə olunur."
echo "ℹ️  Statusu yoxlamaq üçün: 'pm2 list'"
echo "ℹ️  Logları izləmək üçün: 'pm2 logs $PROCESS_NAME'"
echo "----------------------------------------------------"

pm2 logs "$PROCESS_NAME" --lines 100



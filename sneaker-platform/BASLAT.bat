@echo off
chcp 65001 >nul
title SneakerOS
cd /d "%~dp0"

echo.
echo  =============================================
echo   SneakerOS - çok siteli sneaker mağaza platformu
echo  =============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js bulunamadı.
  echo  Açılan sayfadan "LTS" sürümünü indirip kurun, sonra bu dosyaya tekrar çift tıklayın.
  start "" https://nodejs.org/tr/download
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  [1/3] Paketler yükleniyor ^(ilk seferde birkaç dakika sürer^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto hata
) else (
  echo  [1/3] Paketler hazır.
)

if not exist ".data\db\" (
  echo  [2/3] Veritabanı ve demo mağazalar hazırlanıyor...
  call npm run setup
  if errorlevel 1 goto hata
) else (
  echo  [2/3] Veritabanı hazır.
)

echo  [3/3] Uygulama başlatılıyor. Tarayıcı birkaç saniye içinde açılacak.
echo.
echo   Panel:        http://localhost:3000/panel
echo   Süper admin:  admin@sneaker.local / admin12345
echo   Satıcı:       satici@sneaker.local / satici12345
echo   Örnek site:   http://voltaj.localhost:3000
echo.
echo   Kapatmak için bu pencereyi kapatın.
echo.
start "" cmd /c "timeout /t 10 /nobreak >nul & start http://localhost:3000/panel"
call npm run dev
goto :eof

:hata
echo.
echo  Bir hata oluştu. Yukarıdaki mesajı kopyalayıp destek için gönderin.
pause
exit /b 1

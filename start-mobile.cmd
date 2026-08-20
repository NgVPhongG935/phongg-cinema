@echo off
cd /d %~dp0
call stop-mobile.cmd
cd /d %~dp0mobile
if not exist .env copy .env.example .env
echo.
echo === PHONGG CINEMA MOBILE (Expo SDK 54) ===
echo API tu dong proxy qua Metro - khong can mo firewall 8080.
echo Can chay backend: .\start-backend.cmd
echo.
echo TREN DIEN THOAI: quet QR bang Expo Go SDK 54 (KHONG bam phim w)
echo.
call npm install
npx expo start -c --port 8081

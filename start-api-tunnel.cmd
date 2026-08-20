@echo off
:: Tunnel backend ra internet - KHONG can mo firewall / cung WiFi
:: Can: backend dang chay tren port 8080
echo.
echo === TUNNEL API BACKEND (localtunnel) ===
echo Dang tao URL public cho backend...
echo.
echo SAU KHI CO URL (vd: https://abc-xyz.loca.lt):
echo   Trong app - Tab Tai khoan - dat API:
echo   https://abc-xyz.loca.lt/api/v1
echo   Bam "Luu ^& thu"
echo.
echo Nhan Ctrl+C de dung tunnel.
echo.
npx --yes localtunnel --port 8080

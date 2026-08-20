@echo off
:: Mo port 8080 cho dien thoai (can quyen Admin)
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Dang yeu cau quyen Administrator...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

netsh advfirewall firewall delete rule name="QLBVXP Backend 8080" >nul 2>&1
netsh advfirewall firewall add rule name="QLBVXP Backend 8080" dir=in action=allow protocol=TCP localport=8080 profile=any enable=yes
if %errorlevel% equ 0 (
  echo.
  echo [OK] Da mo port 8080 ^(moi profile: Private + Public^).
  for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :found
  )
  :found
  echo.
  echo Thu tren trinh duyet DIEN THOAI:
  echo   http://%IP:~1%:8080/api/v1/movies?size=1
  echo.
  echo Trong app - Tab Tai khoan - API URL:
  echo   http://%IP:~1%:8080/api/v1
) else (
  echo [LOI] Khong them duoc rule firewall.
)
echo.
pause

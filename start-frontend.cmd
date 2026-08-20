@echo off
cd /d "%~dp0frontend"
if not exist package.json (
  echo.
  echo [LOI] Khong tim thay package.json trong thu muc frontend.
  echo.
  exit /b 1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo.
  echo [INFO] Frontend DA CHAY san tren port 5173 ^(PID %%a^).
  echo        Khong can chay lai! Mo http://localhost:5173 de kiem tra.
  echo.
  exit /b 0
)
if not exist node_modules (
  echo Dang cai dat dependencies lan dau...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Dang khoi dong frontend...
call npm run dev

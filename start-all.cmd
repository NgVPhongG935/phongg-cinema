@echo off
cd /d "%~dp0"

if not exist package.json (
  echo [LOI] Khong tim thay package.json trong thu muc du an.
  exit /b 1
)

call npm run dev

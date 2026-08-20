@echo off
setlocal enabledelayedexpansion
set "daTimThay=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  echo Dang dung process PID %%a tren port 8080...
  taskkill /PID %%a /F
  set "daTimThay=1"
)
if "!daTimThay!"=="0" (
  echo Khong co process nao dang chay tren port 8080.
) else (
  echo Da giai phong port 8080.
)

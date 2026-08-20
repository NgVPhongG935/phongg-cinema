@echo off
:: Dung khi dien thoai cam USB + bat USB debugging
where adb >nul 2>&1
if %errorlevel% neq 0 (
  echo [LOI] Khong tim thay adb. Cai Android Platform Tools hoac Android Studio.
  pause
  exit /b 1
)

adb reverse tcp:8080 tcp:8080
if %errorlevel% neq 0 (
  echo [LOI] adb reverse that bai. Kiem tra USB debugging va cap dien thoai.
  pause
  exit /b 1
)

echo.
echo [OK] Dien thoai co the goi backend qua:
echo   http://127.0.0.1:8080/api/v1
echo.
echo Trong app: Tab Tai khoan - dat API URL tren va bam "Luu & thu"
echo.
pause

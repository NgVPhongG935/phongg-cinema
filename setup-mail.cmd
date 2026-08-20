@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  PHONGG CINEMA - Cau hinh email ve
echo ========================================
echo.

if exist mail.local.cmd (
  echo File mail.local.cmd DA TON TAI.
  echo Mo de sua Gmail / App Password?
  choice /C YN /M "Mo mail.local.cmd trong Notepad"
  if errorlevel 2 goto :done
  notepad mail.local.cmd
  goto :done
)

echo Buoc 1: Tao Gmail App Password
echo   - Vao https://myaccount.google.com/security
echo   - Bat Xac minh 2 buoc (2FA)
echo   - Tim "Mat khau ung dung" / App passwords
echo   - Tao mat khau cho "Mail" — copy 16 ky tu
echo.
echo Buoc 2: Sua mail.local.cmd — bat MAIL_ENABLED=true va dien Gmail
echo.

if not exist mail.local.cmd (
  copy /Y mail.local.cmd.example mail.local.cmd
)
notepad mail.local.cmd

echo.
echo Sau khi luu file:
echo   1. stop-backend.cmd
echo   2. start-backend.cmd
echo   3. Log phai hien: EMAIL VE: BAT
echo   4. Admin duyet ve CK hoac VNPay/MoMo -> mail toi email tai khoan khach
echo.

:done
endlocal

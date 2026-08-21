@echo off
cd /d %~dp0

REM Giai phong 8080 neu trung (backend cu / process treo)
call "%~dp0stop-backend.cmd"

if exist "%~dp0mail.local.cmd" (
  echo [CONFIG] Nap mail.local.cmd ...
  call "%~dp0mail.local.cmd"
)

if exist "%~dp0gemini.local.cmd" (
  echo [CONFIG] Nap gemini.local.cmd ...
  call "%~dp0gemini.local.cmd"
)

if exist "%~dp0tmdb.local.cmd" (
  echo [CONFIG] Nap tmdb.local.cmd ...
  call "%~dp0tmdb.local.cmd"
)

if "%GEMINI_ENABLED%"=="true" if "%GEMINI_API_KEY%"=="" (
  echo.
  echo ============================================================
  echo  [LOI] GEMINI_API_KEY CHUA DUOC DIEN!
  echo  AI Soan Noi Dung phim KHONG CHAY duoc.
  echo  Chay setup-gemini.cmd va dien GEMINI_API_KEY
  echo ============================================================
  echo.
)

REM Mac dinh: profile atlas (dung MongoDB Atlas cloud)
REM Muon chay Mongo nhung offline: set SPRING_PROFILES_ACTIVE=local
if "%SPRING_PROFILES_ACTIVE%"=="" set SPRING_PROFILES_ACTIVE=atlas

echo.
echo ============================================================
echo  Backend profile: %SPRING_PROFILES_ACTIVE%
echo  atlas = MongoDB Atlas Cloud
echo  local = Mongo nhung offline
echo ============================================================
echo.

echo Dang khoi dong backend...
call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=%SPRING_PROFILES_ACTIVE%"
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  [LOI] Backend KHONG chay duoc.
  echo  Profile local: kiem tra mang tai Mongo embedded / Java 17.
  echo  Profile Atlas: Network Access whitelist IP tren cloud.mongodb.com
  echo ============================================================
  echo.
  exit /b 1
)

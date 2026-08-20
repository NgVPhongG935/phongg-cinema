@ECHO OFF
setlocal
set "MAVEN_HOME=%~dp0.mvn\tools\apache-maven-3.9.9"
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo [ERROR] Maven chua duoc cai trong project.
  exit /b 1
)
if exist "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot\bin\javac.exe" (
  set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
) else (
  for /f "delims=" %%i in ('where javac 2^>nul') do (
    set "JAVA_HOME=%%~dpi"
    goto :daCoJavaHome
  )
  echo [ERROR] Khong tim thay JDK 17. Vui long cai JDK hoac dat JAVA_HOME.
  exit /b 1
)
:daCoJavaHome
if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
if exist "%JAVA_HOME%\bin\javac.exe" goto :chayMaven
set "JAVA_HOME=%JAVA_HOME%\.."
if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
:chayMaven
call "%MAVEN_HOME%\bin\mvn.cmd" %*

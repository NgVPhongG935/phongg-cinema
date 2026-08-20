@echo off
echo Dang tat Metro/Expo cu (port 8081-8083)...
for %%p in (8081 8082 8083) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
)
echo Da tat (neu co).

@echo off
cd /d "%~dp0"
if not exist gemini.local.cmd (
  copy /Y gemini.local.cmd.example gemini.local.cmd
  echo Mo gemini.local.cmd va dien GEMINI_API_KEY (AIza...)
  notepad gemini.local.cmd
) else (
  notepad gemini.local.cmd
)
echo Sau khi luu: stop-backend.cmd -> start-backend.cmd

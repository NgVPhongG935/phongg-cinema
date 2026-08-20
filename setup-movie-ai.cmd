@echo off
cd /d "%~dp0"
echo Cai Python packages cho AI soan noi dung phim...
python -m pip install --upgrade pip
python -m pip install -r scripts\requirements-movie-ai.txt
echo.
echo Hoan tat. Chay start-searxng.cmd neu chua co SearXNG.
echo.

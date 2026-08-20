@echo off
cd /d "%~dp0"
docker compose -f docker-compose.searxng.yml up -d
echo.
echo SearXNG: http://127.0.0.1:8888
echo Test: http://127.0.0.1:8888/search?q=moana+film&format=json
echo.

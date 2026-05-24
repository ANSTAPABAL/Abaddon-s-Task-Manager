@echo off
echo ==========================================================
echo          Abaddon's Task Vessel - Focus RPG
echo ==========================================================
echo.
echo [1/2] Opening browser at http://127.0.0.1:5173...
start http://127.0.0.1:5173

echo [2/2] Launching backend server and frontend client...
echo.
powershell -ExecutionPolicy Bypass -Command "npm run dev"

pause

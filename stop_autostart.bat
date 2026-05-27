@echo off
echo ==========================================================
echo        Stopping Abaddon's Task Manager Background Server
echo ==========================================================
echo.

echo Stopping backend server (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping frontend client (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] Background processes successfully terminated.
timeout /t 3 >nul

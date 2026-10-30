@echo off
setlocal
title ParkPulse Frontend UI (Vite + React)
cd /d "%~dp0frontend"

echo =====================================================================
echo  Starting ParkPulse Frontend UI (Vite + React)
echo  Local Portal: http://localhost:5173
echo =====================================================================
echo.

call npm run dev -- --host

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend dev server terminated with an error.
    pause
)

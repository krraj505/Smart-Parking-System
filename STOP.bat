@echo off
setlocal
title ParkPulse - Stop Application Services

echo =====================================================================
echo       STOPPING PARKPULSE SMART PARKING APPLICATION SERVICES
echo =====================================================================
echo.

echo Stopping services on Port 8000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping services on Port 5173 (Frontend UI)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] Application servers stopped cleanly.
echo.
timeout /t 2 /nobreak >nul
exit /b 0

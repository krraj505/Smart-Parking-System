@echo off
setlocal enabledelayedexpansion
title ParkPulse - Smart Parking Management System Launcher

echo =====================================================================
echo           PARKPULSE - SMART PARKING MANAGEMENT SYSTEM
echo =====================================================================
echo.
echo [1/5] Determining project root directory...
cd /d "%~dp0"
set "PROJECT_ROOT=%~dp0"
echo       Project Root: %PROJECT_ROOT%
echo.

echo [2/5] Validating project directories and configuration...
if not exist "%PROJECT_ROOT%backend" (
    echo [ERROR] 'backend' directory not found at: %PROJECT_ROOT%backend
    goto :ERROR_EXIT
)
if not exist "%PROJECT_ROOT%frontend" (
    echo [ERROR] 'frontend' directory not found at: %PROJECT_ROOT%frontend
    goto :ERROR_EXIT
)

rem Environment configuration check
if not exist "%PROJECT_ROOT%.env" (
    if exist "%PROJECT_ROOT%.env.example" (
        echo [INFO] .env file not found. Creating default .env from .env.example...
        copy "%PROJECT_ROOT%.env.example" "%PROJECT_ROOT%.env" >nul
        echo [OK] Created .env configuration successfully.
    ) else (
        echo [WARNING] Neither .env nor .env.example found. Backend will use internal defaults.
    )
) else (
    echo [OK] Existing .env file detected. Preserving existing configuration.
)

rem Python virtual environment check
set "VENV_PYTHON=%PROJECT_ROOT%venv\Scripts\python.exe"
if exist "%VENV_PYTHON%" (
    echo [OK] Virtual environment detected: %VENV_PYTHON%
) else (
    echo [WARNING] Dedicated virtual environment not found at: %PROJECT_ROOT%venv
    echo           Checking system Python...
    where python >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Python was not found on your system or in venv.
        echo         Please install Python 3.12+ from https://python.org and add it to PATH.
        goto :ERROR_EXIT
    )
    set "VENV_PYTHON=python"
)

rem Node.js and npm check
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system PATH.
    echo         Please install Node.js from https://nodejs.org
    goto :ERROR_EXIT
)

rem Check frontend dependencies
if not exist "%PROJECT_ROOT%frontend\node_modules" (
    echo [WARNING] 'frontend\node_modules' not found. Installing packages...
    pushd "%PROJECT_ROOT%frontend"
    call npm install
    popd
)

echo [OK] All system prerequisites verified successfully.
echo.

echo [3/5] Starting FastAPI Backend on http://localhost:8000 ...
start "ParkPulse Backend API (FastAPI)" "%PROJECT_ROOT%start_backend.bat"

echo [4/5] Starting Vite React Frontend on http://localhost:5173 ...
start "ParkPulse Frontend UI (Vite)" "%PROJECT_ROOT%start_frontend.bat"

echo [5/5] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo  PARKPULSE IS RUNNING!
echo =====================================================================
echo.
echo  * Frontend Portal:      http://localhost:5173
echo  * Backend API:          http://localhost:8000
echo  * Swagger API Docs:     http://localhost:8000/docs
echo.
echo  Opening browser now...
start http://localhost:5173
echo.
echo  Keep the two opened terminal windows (Backend and Frontend) running.
echo  To shut down both servers safely, run STOP.bat or close their windows.
echo =====================================================================
echo.
pause
exit /b 0

:ERROR_EXIT
echo.
echo =====================================================================
echo  STARTUP FAILED! Please review the error message above.
echo =====================================================================
echo.
pause
exit /b 1

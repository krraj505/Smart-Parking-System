@echo off
setlocal
title ParkPulse Backend API (FastAPI)
cd /d "%~dp0"

echo =====================================================================
echo  Starting ParkPulse Backend API (FastAPI)
echo  Listening on: http://127.0.0.1:8000
echo  API Documentation: http://127.0.0.1:8000/docs
echo =====================================================================
echo.

if exist "%~dp0venv\Scripts\python.exe" (
    "%~dp0venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend process terminated with an error.
    pause
)

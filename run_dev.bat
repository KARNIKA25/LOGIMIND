@echo off
title LOGIMIND v2 Launcher
echo ==========================================================
echo   LOGIMIND v2 - AI Logistics Intelligence Platform
echo ==========================================================

set PATH=C:\Users\karnika\AppData\Local\Programs\nodejs\node-v22.23.3-win-x64;C:\Users\karnika\AppData\Local\Python\bin;%PATH%

echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo Backend Docs: http://localhost:8000/docs
echo Frontend App: http://localhost:5173
echo Login: admin@logimind.ai / LogiMind@2026

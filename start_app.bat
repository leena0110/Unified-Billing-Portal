@echo off
title RITE ELECTRICALS - Billing System
echo.
echo ============================================
echo   RITE ELECTRICALS - Billing System
echo   Starting application...
echo ============================================
echo.

:: Start Backend Server
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload"

:: Wait for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend Server
echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to initialize
timeout /t 5 /nobreak > nul

:: Open browser
echo.
echo [OK] Opening browser...
start http://localhost:5173

echo.
echo ============================================
echo   App is running! Browser should open.
echo   
echo   DO NOT close the black terminal windows
echo   until you are done for the day.
echo ============================================
echo.
pause

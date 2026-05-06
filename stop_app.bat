@echo off
title Shutting Down Billing System
echo.
echo Shutting down RITE ELECTRICALS Billing System...
echo.

:: Kill uvicorn (backend)
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Backend Server" >nul 2>&1

:: Kill node (frontend)  
taskkill /f /fi "WINDOWTITLE eq Frontend Server" >nul 2>&1

echo [OK] Application stopped.
echo.
pause

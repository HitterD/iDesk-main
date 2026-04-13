@echo off
setlocal enabledelayedexpansion

:: Add Node.js to PATH explicitly
SET PATH=%PATH%;C:\Program Files\nodejs\

:: Detect Local IP Address dynamically
set "IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr /V "127.0.0.1"') do (
    set "TEMP_IP=%%a"
    set "TEMP_IP=!TEMP_IP: =!"
    if not "!TEMP_IP!"=="" (
        set "IP=!TEMP_IP!"
        goto :ip_found
    )
)
:ip_found

echo ===================================================
echo Starting iDesk Development Environment...
echo Detected IP Address: !IP!
echo ===================================================

:: Start Backend
start "iDesk Backend" cmd /k "set FRONTEND_URL=http://!IP!:4050&& cd apps\backend && npm run start:dev"

:: Start Frontend
start "iDesk Frontend" cmd /k "set VITE_API_URL=http://!IP!:5050&& cd apps\frontend && npm run dev"

:: Wait for services to start (approx 10 seconds)
timeout /t 10 /nobreak >nul 2>&1

:: Open Browser
start http://!IP!:4050

echo ===================================================
echo Development environment started!
echo Accessible locally: http://localhost:4050
echo Accessible network: http://!IP!:4050
echo ===================================================

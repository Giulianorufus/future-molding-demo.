@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d %~dp0

rem 1) Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

rem 2) Install deps if missing
if not exist node_modules (
  echo Installing dependencies (npm install)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Dependencies installation failed.
    pause
    exit /b 1
  )
)

set HOST=127.0.0.1
set PORT=5274
echo Starting dev server on %HOST%:%PORT% ...
start "dev-5274" cmd /k "npm run dev:5274"
timeout /t 2 >nul
start "" "http://%HOST%:%PORT%/#/"
echo Dev server launched on %HOST%:%PORT%.
echo If the browser did not open, copy the URL above.


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

echo Building production files...
npm run build || goto :error
echo Starting preview on 127.0.0.1:5274 ...
start "preview-5274" cmd /k "npm run preview:5274"
timeout /t 2 >nul
start "" "http://127.0.0.1:5274/#/"
echo Preview launched. If the browser did not open, copy the URL above.
goto :eof

:error
echo.
echo Build failed. Please check errors above.
pause


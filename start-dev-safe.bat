@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d %~dp0
set HOST=127.0.0.1
set PORT=3000
echo Starting dev server on %HOST%:%PORT% ...
start "dev-safe" cmd /k "npm run dev:safe"
timeout /t 2 >nul
start "" "http://127.0.0.1:3000/#/"
echo Dev server launched. If the browser did not open, copy the URL above.


@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d %~dp0
echo Building production files...
npm run build || goto :error
echo Starting preview on 127.0.0.1:8080 ...
start "preview-safe" cmd /k "npm run preview:safe"
timeout /t 2 >nul
start "" "http://127.0.0.1:8080/#/"
echo Preview launched. If the browser did not open, copy the URL above.
goto :eof

:error
echo.
echo Build failed. Please check errors above.
pause


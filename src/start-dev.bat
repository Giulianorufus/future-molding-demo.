@echo off
REM Spostati nella cartella del progetto
cd /d %~dp0

REM Ferma eventuali server già in esecuzione
taskkill /F /IM node.exe >nul 2>&1

REM Avvia il dev server
start cmd /k "npm run dev"

REM Aspetta qualche secondo
timeout /t 3 >nul

REM Apri il browser su Parametri
start http://localhost:5173/#/parametri

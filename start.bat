@echo off
setlocal

set "ROOT=%~dp0"
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo Starting AMS backend...
start "AMS Backend" pwsh -NoExit -Command "cd '%ROOT%'; npm run dev --workspace server"

echo Starting AMS frontend...
start "AMS Frontend" pwsh -NoExit -Command "cd '%ROOT%'; npm run dev --workspace client"

echo Waiting for services to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:5173

endlocal

@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo Checking prerequisites...
call :checkCommand node "Node.js"
if errorlevel 1 goto :error
call :checkCommand npm "npm"
if errorlevel 1 goto :error
call :checkCommand pwsh "PowerShell (pwsh)"
if errorlevel 1 goto :error

if not exist "%ROOT%package.json" (
	echo [ERROR] package.json not found at %ROOT%
	goto :error
)

if not exist "%ROOT%node_modules" (
	echo Installing project dependencies...
	pushd "%ROOT%" >nul
	call npm install
	if errorlevel 1 (
		popd >nul
		echo [ERROR] npm install failed.
		goto :error
	)
	popd >nul
) else (
	echo Dependencies already installed. Skipping npm install.
)

if not exist "%ROOT%server\.env" (
	echo Creating server\.env from template...
	if exist "%ROOT%server\.env.example" (
		copy /Y "%ROOT%server\.env.example" "%ROOT%server\.env" >nul
		echo [INFO] Generated server\.env. Review the secrets before running in production.
	) else (
		echo [ERROR] server\.env is missing and no template was found.
		goto :error
	)
) else (
	echo Found existing server\.env.
)

echo Starting AMS backend...
start "AMS Backend" pwsh -NoExit -Command "cd '%ROOT%'; npm run dev --workspace server"

echo Starting AMS frontend...
start "AMS Frontend" pwsh -NoExit -Command "cd '%ROOT%'; npm run dev --workspace client"

echo Waiting for services to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:5173

goto :EOF

:checkCommand
where %1 >nul 2>nul
if errorlevel 1 (
	echo [ERROR] Required command %2 is not available in PATH.
	exit /b 1
)
exit /b 0

:error
echo.
echo Startup aborted due to missing requirements.
exit /b 1

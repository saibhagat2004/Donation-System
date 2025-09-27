@echo off
REM Fix Ganache connection issues

echo === Ganache Connection Fix Tool ===
echo This script will help resolve connection issues with Ganache
echo.

REM Check if Ganache is installed
WHERE ganache >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Ganache not found! Installing it globally...
    call npm install -g ganache
    echo.
)

REM Check if any process is using port 7545
netstat -ano | findstr :7545 > temp.txt
set /p PORT_CHECK=<temp.txt
del temp.txt

IF NOT "%PORT_CHECK%"=="" (
    echo Warning: Process already using port 7545:
    echo %PORT_CHECK%
    echo.
    echo Attempting to close existing Ganache processes...
    taskkill /f /im node.exe /fi "WINDOWTITLE eq ganache*" > nul 2>&1
    echo Waiting 5 seconds...
    timeout /t 5 /nobreak > nul
)

REM Start Ganache with proper config
echo Starting Ganache with explicit host binding...
echo This allows connections from both localhost and 127.0.0.1
ganache --port 7545 --host 0.0.0.0 --deterministic

REM Note: The script will stay running with Ganache active
REM User needs to press Ctrl+C to exit
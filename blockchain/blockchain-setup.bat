@echo off
echo.
echo ===== Donation System Blockchain Setup =====
echo.

:MENU
echo Choose an option:
echo 1. Install dependencies
echo 2. Start Ganache and deploy contract
echo 3. Start web interface
echo 4. Quit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto START_GANACHE
if "%choice%"=="3" goto START_WEB
if "%choice%"=="4" goto END
goto MENU

:INSTALL
echo.
echo Installing dependencies...
echo.
npm install
echo.
echo Dependencies installed successfully.
echo.
goto MENU

:START_GANACHE
echo.
echo Starting Ganache...
start /B ganache --port 7545 --deterministic
echo.
echo Waiting for Ganache to start...
timeout /t 3
echo.
echo Deploying contract to Ganache...
npx hardhat run scripts/deploy-to-ganache.js --network ganache
echo.
echo Contract deployed and ready to use.
echo.
goto MENU

:START_WEB
echo.
echo Starting web interface...
echo.
echo The web interface is now running at http://localhost:3000
echo.
echo Press Ctrl+C when you want to stop the web interface.
echo.
node server.js
goto MENU

:END
echo.
echo Thank you for using the Donation System Blockchain.
echo.
exit /b 0
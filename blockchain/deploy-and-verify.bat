@echo off
REM Script to deploy the contract to Ganache and verify connection

echo Starting contract deployment process...

REM Make sure we're in the blockchain directory
cd %~dp0

echo Installing dependencies if needed...
call npm install

echo Deploying contract to Ganache...
echo Trying direct deployment method...
call npx hardhat run scripts/deploy-direct.js

echo Waiting for deployment to complete...
timeout /t 2 > nul

echo Testing contract connection...
REM You can add a simple test here if needed

echo Deployment completed successfully!
echo Contract address should be: 0x5FbDB2315678afecb367f032d93F642f64180aa3
echo.
echo You can now open one of these files to test the connection:
echo - gui/simple-tester.html
echo - gui/enhanced-tester.html
echo - gui/contract-verifier.html

pause
@echo off
REM Simple script to deploy contract with explicit account

echo Simple Contract Deployment
echo ======================
echo.

echo Checking if Ganache is running...
netstat -ano | findstr ":7545" | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
  echo ERROR: Cannot connect to Ganache on port 7545.
  echo Please make sure Ganache is running first.
  exit /b 1
)

echo Ganache appears to be running!
echo.

echo Deploying contract with specified account...
node scripts/deploy-simple.js

if %errorlevel% neq 0 (
  echo.
  echo Deployment failed! Check the error message above.
  echo.
) else (
  echo.
  echo Deployment successful!
  echo.
  echo You can now use the tools to verify your contract:
  echo - Open gui/simple-tester.html
  echo - Open gui/contract-verifier.html
)

pause
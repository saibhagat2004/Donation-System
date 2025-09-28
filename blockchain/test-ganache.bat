@echo off
echo Testing Ganache Connection
echo =======================
echo.

cd %~dp0
node scripts\test-ganache-connection.js

if %errorlevel% neq 0 (
  echo.
  echo Connection test failed!
) else (
  echo.
  echo Connection test succeeded!
)

pause
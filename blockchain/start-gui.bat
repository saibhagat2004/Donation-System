@echo off
echo Starting Ganache...
start /B ganache --port 7545 --deterministic --miner.blockGasLimit 12000000

echo Waiting for Ganache to start...
timeout /t 3

echo Deploying the contract to Ganache...
npx hardhat run scripts/deploy-to-ganache.js --network ganache

echo.
echo Press Ctrl+C to stop the web server (Ganache will keep running)
echo To stop Ganache, close its terminal window
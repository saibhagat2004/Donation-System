@echo off
echo.
echo === Manual Contract Deployment ===
echo.
echo This script will help you deploy the contract to Ganache
echo and configure your web interface to use it.
echo.

echo Starting Ganache...
echo.
start ganache --port 7545 --deterministic
echo.

echo Wait a few seconds for Ganache to start...
timeout /t 3 > nul
echo.

echo Compiling contract...
npx hardhat compile
echo.

echo Opening Ganache terminal output...
echo Copy one of the private keys from the Ganache output.
echo.
pause

echo.
echo Now we'll deploy the contract using hardhat console.
echo.
echo Type the following commands in the hardhat console:
echo.
echo   const Donation = await ethers.getContractFactory("Donation")
echo   const donation = await Donation.deploy()
echo   const address = await donation.getAddress()
echo   console.log("Contract deployed to:", address)
echo   .exit
echo.
echo After deployment, copy the contract address.
echo.
pause

echo.
echo Starting hardhat console...
npx hardhat console --network ganache
echo.

echo.
echo Enter the contract address you copied:
set /p CONTRACT_ADDRESS=
echo.

echo.
echo Saving contract address to contract-address.json...
echo {"address": "%CONTRACT_ADDRESS%"} > contract-address.json
echo.

echo.
echo Starting web server...
echo.
echo The web interface will be available at http://localhost:3000
echo Press Ctrl+C to stop the server when finished.
echo.
node server.js
# Deployment Workaround for Ganache Integration

This document provides a workaround for deploying the Donation smart contract to Ganache when encountering issues with the automated scripts.

## The Issue

There have been compatibility issues between different versions of ethers.js, hardhat, and Ganache that can cause deployment errors such as:
- "Insufficient funds for gas * price + value"
- "TypeError: deployer.getBalance is not a function"
- Other deployment transaction failures

## Simplified Manual Deployment Solution

To avoid these issues, we've created two scripts that provide a step-by-step guided approach:

- For Windows: `manual-deploy.bat`
- For Mac/Linux: `manual-deploy.sh` (make executable with `chmod +x manual-deploy.sh`)

## How the Manual Deployment Works

These scripts will:

1. Start Ganache locally
2. Compile the contract
3. Open a hardhat console for you to manually deploy the contract
4. Guide you through entering the required commands
5. Save the contract address to the required JSON file
6. Start the web server

## Step by Step Instructions

1. Run the appropriate script for your platform:
   ```
   manual-deploy.bat   # Windows
   ./manual-deploy.sh  # Mac/Linux
   ```

2. Wait for Ganache to start and take note of the available accounts and private keys

3. When the hardhat console opens, enter these commands one by one:
   ```javascript
   const Donation = await ethers.getContractFactory("Donation")
   const donation = await Donation.deploy()
   const address = await donation.getAddress()
   console.log("Contract deployed to:", address)
   .exit
   ```

4. Copy the contract address from the output

5. When prompted, paste the contract address

6. The script will save the address to the required file and start the web server

7. Open http://localhost:3000 in your browser to access the web interface

8. Click "Connect Wallet" and use the "Set Contract Address" button with your contract address

## Using the Web Interface Without MetaMask

For local development and testing, you can use the web interface without MetaMask. The interface has been designed to work directly with your local Ganache blockchain.

## For Advanced Users

If you prefer a more manual approach, you can:

1. Start Ganache: `ganache --port 7545 --deterministic`
2. Open a hardhat console: `npx hardhat console --network ganache`
3. Deploy manually using the commands shown above
4. Create the contract-address.json file: `{"address": "YOUR_CONTRACT_ADDRESS"}`
5. Start the web server: `node server.js`

This approach bypasses any compatibility issues with the deployment scripts.
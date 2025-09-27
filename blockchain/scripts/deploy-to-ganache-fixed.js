// deploy-to-ganache.js - Fixed for ethers v6
// This script deploys the Donation contract to Ganache

const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  console.log("Deploying contract to Ganache...");

  // Get the signers
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying with account:", deployerAddress);
  
  // Check account balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const Donation = await ethers.getContractFactory("Donation");
  
  console.log("Starting deployment transaction...");
  // Deploy the contract
  const donation = await Donation.deploy();
  console.log("Deployment transaction sent:", donation.deploymentTransaction().hash);
  
  // Wait for deployment to complete
  console.log("Waiting for confirmation...");
  await donation.waitForDeployment();
  
  // Get the contract address
  const contractAddress = await donation.getAddress();
  
  console.log("Contract deployed to:", contractAddress);
  
  // Save the address to a file
  const addressFile = path.join(__dirname, "..", "contract-address.json");
  fs.writeFileSync(
    addressFile,
    JSON.stringify({ address: contractAddress }, null, 2)
  );
  
  console.log(`Contract address saved to ${addressFile}`);
  console.log("\nTo use this contract in the GUI:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log("2. Click 'Connect Wallet' and connect to MetaMask");
  console.log("3. Click 'Set Contract Address' and enter:", contractAddress);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
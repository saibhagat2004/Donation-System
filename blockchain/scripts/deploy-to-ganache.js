// deploy-to-ganache.js
// This script deploys the Donation contract to Ganache

const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  console.log("Deploying contract to Ganache...");

  // Get the signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  
  // Check account balance
  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const Donation = await ethers.getContractFactory("Donation");
  
  // Deploy the contract
  const donation = await Donation.deploy();

  // Wait for deployment to complete - handle either v5 or v6 ethers
  if (typeof donation.deployed === 'function') {
    // Ethers v5
    await donation.deployed();
  } else if (typeof donation.waitForDeployment === 'function') {
    // Ethers v6
    await donation.waitForDeployment();
  } else {
    // Default fallback
    await donation.deployTransaction.wait();
  }
  
  // Get the contract address - handle either v5 or v6 ethers
  const contractAddress = donation.address || await donation.getAddress();
  
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
    console.error(error);
    process.exit(1);
  });
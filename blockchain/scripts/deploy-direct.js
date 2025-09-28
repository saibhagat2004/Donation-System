// deploy-direct.js - Direct deployment script with hardcoded private key
// For use when other deployment methods fail

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Contract ABI and bytecode
const contractArtifact = require('../artifacts/contracts/Donation.sol/Donation.json');

async function main() {
  console.log("Starting direct contract deployment...");
  
  // The private key for the first default Hardhat account
  // This matches the account we're connecting with in the GUI
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  
  // Connect to the provider - using correct network format for ethers.js v6.15.0
  console.log("Connecting to Ganache on http://127.0.0.1:7545...");
  
  // Create provider with proper network configuration for ethers v6.15.0
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:7545",
    {
      chainId: 1337,
      name: "ganache"
    }
  );
  
  // Create a wallet with the private key
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = await wallet.getAddress();
  
  console.log(`Using account: ${address}`);
  
  // Check the balance
  const balance = await provider.getBalance(address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance <= ethers.parseEther("0.1")) {
    console.log("Warning: Account balance is low. Deployment might fail.");
  }
  
  // Create the contract factory
  const contractFactory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );
  
  console.log("Deploying contract...");
  try {
    // Deploy with higher gas price if needed
    const deploymentOptions = {
      gasLimit: 5000000
    };
    
    console.log("Creating deployment transaction...");
    const contract = await contractFactory.deploy(deploymentOptions);
    
    const txHash = contract.deploymentTransaction()?.hash;
    console.log(`Deployment transaction sent: ${txHash}`);
    console.log("Waiting for confirmation...");
    
    // Wait for deployment with additional error handling
    try {
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      console.log(`Contract deployed successfully to: ${contractAddress}`);
      
      // Save contract address to file
      const addressFile = path.join(__dirname, "..", "contract-address.json");
      fs.writeFileSync(
        addressFile,
        JSON.stringify({ address: contractAddress }, null, 2)
      );
      
      console.log(`Contract address saved to ${addressFile}`);
      
      return { success: true, address: contractAddress };
    } catch (waitError) {
      console.error("Error while waiting for deployment:", waitError.message);
      if (txHash) {
        console.log("You can check the transaction status with this hash:", txHash);
      }
      throw waitError;
    }
  } catch (error) {
    console.error("Deployment failed:", error);
    return { success: false, error: error.message };
  }
}

// Run the deployment
main()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
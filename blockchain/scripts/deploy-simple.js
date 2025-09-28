// deploy-simple.js - Simplified direct deployment script
// For when other scripts fail

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');  // Note: Using ethers directly, not from hardhat

// Import the compiled contract JSON manually - this avoids hardhat dependency
const contractPath = path.join(__dirname, '../artifacts/contracts/Donation.sol/Donation.json');
const contractJson = require(contractPath);

async function main() {
  console.log("Starting simplified deployment script...");
  
  // Using your updated account address and private key
  // Account: 0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0
  const privateKey = "0x69c3cf937091d5c71fe45ca0e738e5c54c96ddc233e8b61f0590a0081c6fd4f8";
  
  try {
    // Connect to Ganache - using the updated ethers v6 provider initialization
    console.log("Connecting to Ganache...");
    // Explicitly specify the network configuration for ethers v6
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545", undefined, {
      staticNetwork: true,
      polling: true,
      pollingInterval: 1000
    });
    
    // Simple connection test
    const network = await provider.getNetwork();
    console.log(`Connected to network: chainId ${network.chainId.toString()}`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
    
    // Create a wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log(`Using account: ${address}`);
    
    // Verify if the address matches what we expect
    const targetAddress = "0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0";
    if (address.toLowerCase() !== targetAddress.toLowerCase()) {
      console.log(`⚠️ Warning: The address generated from the private key (${address}) doesn't match the expected address (${targetAddress})`);
      console.log("This may cause deployment issues if you don't have funds in this account.");
      
      // For demonstration, let's check the balance of the target address as well
      const targetBalance = await provider.getBalance(targetAddress);
      console.log(`Target address balance: ${ethers.formatEther(targetBalance)} ETH`);
    }
    
    // Check balance
    const balance = await provider.getBalance(address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("1")) {
      console.log("Warning: Account balance may be low for deployment.");
    }
    
    // Create contract factory
    console.log("Creating contract factory...");
    const abi = contractJson.abi;
    const bytecode = contractJson.bytecode;
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy with explicit gas settings
    console.log("Deploying contract...");
    const deployOptions = {
      gasLimit: 6000000,  // Higher gas limit
    };
    
    const deployTx = await factory.deploy(deployOptions);
    console.log(`Deployment transaction created: ${deployTx.deploymentTransaction().hash}`);
    
    console.log("Waiting for confirmation...");
    const contract = await deployTx.waitForDeployment();
    
    // Get contract address (ethers v6 style)
    const contractAddress = await contract.getAddress();
    console.log(`Contract successfully deployed to: ${contractAddress}`);
    
    // Save the address to file
    const addressFile = path.join(__dirname, "..", "contract-address.json");
    fs.writeFileSync(
      addressFile,
      JSON.stringify({ address: contractAddress }, null, 2)
    );
    
    console.log(`Contract address saved to ${addressFile}`);
    console.log(`\nTo use this contract in the GUI, use this address: ${contractAddress}`);
    
    return { success: true, address: contractAddress };
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
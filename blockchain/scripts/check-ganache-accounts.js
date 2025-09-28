// ganache-accounts.js - Script to check Ganache accounts and balances
// Use this to verify which accounts are available before deployment

const { ethers } = require('ethers');

async function main() {
  console.log("Connecting to Ganache to check accounts...");
  
  // Network configuration for ethers.js v6.15.0
  const networkConfig = {
    chainId: 1337,
    name: "ganache"
  };
  
  // Try both localhost and 127.0.0.1
  let provider;
  try {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545", networkConfig);
    console.log("Connected to Ganache on 127.0.0.1:7545");
  } catch (e) {
    try {
      provider = new ethers.JsonRpcProvider("http://localhost:7545", networkConfig);
      console.log("Connected to Ganache on localhost:7545");
    } catch (e2) {
      console.error("Failed to connect to Ganache:", e2.message);
      console.log("Make sure Ganache is running on port 7545");
      return;
    }
  }

  // Get block number to verify connection
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
  } catch (e) {
    console.error("Failed to get block number:", e.message);
    return;
  }
  
  // Get accounts using eth_accounts RPC call
  try {
    console.log("\nGetting Ganache accounts...");
    const accounts = await provider.send('eth_accounts', []);
    console.log(`Found ${accounts.length} accounts:`);
    
    // Table header
    console.log("\n-------------------------------------------------------------------------");
    console.log("| Index |                  Address                  |      Balance      |");
    console.log("-------------------------------------------------------------------------");
    
    // Get balance for each account
    for (let i = 0; i < accounts.length; i++) {
      const balance = await provider.getBalance(accounts[i]);
      const formattedBalance = ethers.formatEther(balance);
      console.log(`|   ${i.toString().padEnd(2)} | ${accounts[i]} | ${formattedBalance.padEnd(17)} |`);
    }
    
    console.log("-------------------------------------------------------------------------");
    
    // Show first account's private key information
    console.log("\nDeployment Information:");
    console.log("----------------------");
    console.log("For local Hardhat deployment, the default private key is:");
    console.log("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    console.log("\nThis key should correspond to one of the accounts above.");
    console.log("If your Ganache instance uses different accounts, you'll need to update your deployment script with the correct private key.");
    
  } catch (e) {
    console.error("Failed to get accounts:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
// test-ganache-connection.js
// Simple script to test connection to Ganache

const { ethers } = require('ethers');

async function main() {
  console.log("Testing connection to Ganache...");
  
  try {
    // Connect to Ganache with ethers v6
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545", undefined, {
      staticNetwork: true,
      polling: true,
      pollingInterval: 1000
    });
    
    // Test basic connection
    console.log("Attempting to get network info...");
    const network = await provider.getNetwork();
    console.log(`Connected to network: chainId ${network.chainId.toString()}`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
    
    // Get available accounts
    console.log("\nFetching accounts:");
    const accounts = await provider.listAccounts();
    for (let i = 0; i < Math.min(3, accounts.length); i++) {
      const balance = await provider.getBalance(accounts[i].address);
      console.log(`Account ${i}: ${accounts[i].address} - Balance: ${ethers.formatEther(balance)} ETH`);
    }
    
    console.log("\nConnection test successful!");
    return true;
  } catch (error) {
    console.error("Connection failed:", error);
    return false;
  }
}

main()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
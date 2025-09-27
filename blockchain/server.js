const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Add CORS headers to allow connections from the browser
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the GUI directory
app.use(express.static(path.join(__dirname, 'gui')));

// Check for contract address
let contractAddress = '';
const contractAddressFile = path.join(__dirname, 'contract-address.json');
if (fs.existsSync(contractAddressFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
    contractAddress = data.address;
  } catch (error) {
    console.error('Error reading contract address:', error);
  }
}

// Add route for a connection test endpoint
app.get('/api/test-connection', (req, res) => {
  res.json({ success: true, message: 'API server is responding correctly' });
});

// Add diagnostic endpoints
app.get('/api/check-ganache', async (req, res) => {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider('http://localhost:7545');
    const blockNumber = await provider.getBlockNumber();
    res.json({ 
      success: true, 
      message: 'Connected to Ganache', 
      blockNumber: blockNumber,
      network: await provider.getNetwork()
    });
  } catch (error) {
    console.error('Ganache check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to Ganache',
      error: error.message
    });
  }
});

// Helper endpoint to check contract
app.get('/api/check-contract', async (req, res) => {
  const address = req.query.address;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Contract address is required'
    });
  }
  
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider('http://localhost:7545');
    const contractAbi = [{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
    const contract = new ethers.Contract(address, contractAbi, provider);
    const owner = await contract.owner();
    
    res.json({
      success: true,
      message: 'Contract is valid',
      owner: owner
    });
  } catch (error) {
    console.error('Contract check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate contract',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Donation System Blockchain GUI ===`);
  console.log(`Server running at http://localhost:${PORT}/`);
  
  if (contractAddress) {
    console.log(`\nContract address found: ${contractAddress}`);
    console.log('When using the GUI, click "Connect to Ganache" first, then');
    console.log('click "Set Contract Address" and enter this address');
  } else {
    console.log('\nNo contract address found. You need to:');
    console.log('1. Start Ganache: ganache --port 7545 --deterministic');
    console.log('2. Deploy the contract: npx hardhat run --network ganache scripts/deploy-to-ganache-fixed.js');
    console.log('   OR use the manual-deploy.bat script');
    console.log('3. Use the address from step 2 in the GUI by clicking "Set Contract Address"');
  }
  
  console.log('\n=== CONNECTION TROUBLESHOOTING ===');
  console.log('If you have connection issues:');
  console.log('1. Visit http://localhost:3000/connection-tester.html to diagnose');
  console.log('2. Make sure Ganache is running: ganache --port 7545 --deterministic');
  console.log('3. Try connecting to 127.0.0.1 instead of localhost in the tester');
  
  console.log('\nSee GANACHE_GUI_GUIDE.md for detailed setup instructions');
  console.log('\nPress Ctrl+C to stop the server');
});
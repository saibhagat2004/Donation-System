// Simplified version of app.js that works with local Ganache
// without requiring MetaMask

// Global variables
let provider;
let signer;
let donationContract;
let contractAddress = '';

// DOM elements
const connectBtn = document.getElementById('connect-wallet');
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const contractAddressEl = document.getElementById('contract-address');
const ownerAddressEl = document.getElementById('owner-address');
const totalDonationsEl = document.getElementById('total-donations');

// Initialize the application
async function init() {
  setupEventListeners();
  
  try {
    // Check for saved contract address
    if (localStorage.getItem('donationContractAddress')) {
      contractAddress = localStorage.getItem('donationContractAddress');
      await connectToGanache();
    } else {
      // No saved contract address
      connectionText.textContent = 'No contract connected';
      connectionIndicator.className = 'indicator offline';
    }
  } catch (error) {
    console.error('Initialization error:', error);
    connectionText.textContent = 'Connection failed';
    connectionIndicator.className = 'indicator offline';
  }
}

// Setup event listeners
function setupEventListeners() {
  connectBtn.addEventListener('click', connectToGanache);
  document.getElementById('set-contract-btn').addEventListener('click', setContractAddressManually);
  document.getElementById('fetch-ngo-data').addEventListener('click', fetchNgoData);
  document.getElementById('fetch-active-ngos').addEventListener('click', fetchActiveNgos);
  document.getElementById('record-donation').addEventListener('click', recordDonation);
  document.getElementById('record-spending').addEventListener('click', recordSpending);
  document.getElementById('load-more-incoming').addEventListener('click', loadMoreIncomingTransactions);
  document.getElementById('load-more-outgoing').addEventListener('click', loadMoreOutgoingTransactions);
  
  // Setup tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`transactions-${tabId}`).classList.add('active');
    });
  });
}

// Connect directly to Ganache
async function connectToGanache() {
  try {
    // Show connecting state
    connectionText.textContent = 'Connecting...';
    
    // Try both localhost and 127.0.0.1 formats
    try {
      provider = new ethers.JsonRpcProvider('http://localhost:7545');
      await provider.getBlockNumber(); // Test the connection
    } catch (e) {
      console.log('Trying alternative connection format...');
      provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
      await provider.getBlockNumber(); // Test the connection
    }
    
    console.log('Connected to provider successfully');
    
    // Get accounts from Ganache
    try {
      // First try listAccounts (may not work in all ethers versions)
      const accounts = await provider.listAccounts();
      signer = await provider.getSigner(accounts[0]);
    } catch (accountError) {
      console.log('listAccounts failed, trying alternative approach...');
      // Alternative approach for ethers v6
      signer = await provider.getSigner();
    }
    
    // Update UI
    const address = await signer.getAddress();
    connectionText.textContent = `Connected: ${shortenAddress(address)}`;
    connectionIndicator.className = 'indicator online';
    
    // Check for contract address
    if (contractAddress) {
      initializeContract();
    }
  } catch (error) {
    console.error('Error connecting to Ganache:', error);
    connectionText.textContent = 'Connection failed';
    connectionIndicator.className = 'indicator offline';
    alert('Failed to connect to Ganache. Make sure Ganache is running on port 7545.\n\nError details: ' + error.message);
  }
}

// Initialize contract with ABI and address
function initializeContract() {
  if (!contractAddress) {
    console.error('Contract address not set');
    return;
  }
  
  try {
    donationContract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
    contractAddressEl.textContent = contractAddress;
    
    // Fetch initial contract data
    fetchContractData();
  } catch (error) {
    console.error('Error initializing contract:', error);
  }
}

// Fetch basic contract data
async function fetchContractData() {
  try {
    // Get owner address
    const owner = await donationContract.owner();
    ownerAddressEl.textContent = owner;
    
    // Get total donations
    const totalDonations = await donationContract.totalDonations();
    totalDonationsEl.textContent = ethers.formatUnits(totalDonations, 0);
    
    // Load initial transactions
    await loadIncomingTransactions(0, 5);
    await loadOutgoingTransactions(0, 5);
  } catch (error) {
    console.error('Error fetching contract data:', error);
  }
}

// Fetch NGO data
async function fetchNgoData() {
  const ngoId = document.getElementById('ngo-id-input').value;
  if (!ngoId) {
    alert('Please enter an NGO ID');
    return;
  }
  
  try {
    const summary = await donationContract.getNgoSummary(ngoId);
    
    document.getElementById('ngo-total-received').textContent = ethers.formatUnits(summary[0], 0);
    document.getElementById('ngo-total-spent').textContent = ethers.formatUnits(summary[1], 0);
    document.getElementById('ngo-incoming-count').textContent = ethers.formatUnits(summary[2], 0);
    document.getElementById('ngo-outgoing-count').textContent = ethers.formatUnits(summary[3], 0);
    document.getElementById('ngo-balance').textContent = ethers.formatUnits(summary[4], 0);
  } catch (error) {
    console.error('Error fetching NGO data:', error);
    alert('Error fetching NGO data. Please check the NGO ID and try again.');
  }
}

// Fetch active NGOs
async function fetchActiveNgos() {
  try {
    const activeNgos = await donationContract.getActiveNgoIds(100);
    const ngoListEl = document.getElementById('active-ngos-list');
    ngoListEl.innerHTML = '';
    
    activeNgos.forEach(ngoId => {
      const item = document.createElement('div');
      item.className = 'data-list-item';
      item.textContent = ngoId;
      item.addEventListener('click', () => {
        document.getElementById('ngo-id-input').value = ngoId;
        fetchNgoData();
      });
      ngoListEl.appendChild(item);
    });
    
    if (activeNgos.length === 0) {
      const item = document.createElement('div');
      item.className = 'data-list-item';
      item.textContent = 'No active NGOs found';
      ngoListEl.appendChild(item);
    }
  } catch (error) {
    console.error('Error fetching active NGOs:', error);
  }
}

// Record donation
async function recordDonation() {
  const ngoId = document.getElementById('donation-ngo-id').value;
  const donorId = document.getElementById('donation-donor-id').value;
  const cause = document.getElementById('donation-cause').value;
  const amount = document.getElementById('donation-amount').value;
  
  if (!ngoId || !donorId || !cause || !amount) {
    alert('Please fill all fields');
    return;
  }
  
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const tx = await donationContract.recordDonation(ngoId, donorId, cause, amount, timestamp);
    
    const resultEl = document.getElementById('donation-result');
    resultEl.textContent = `Transaction submitted. Hash: ${tx.hash}`;
    resultEl.className = 'result success';
    
    // Wait for the transaction to be mined
    await tx.wait();
    resultEl.textContent = 'Donation recorded successfully!';
    
    // Update UI
    fetchContractData();
    if (document.getElementById('ngo-id-input').value === ngoId) {
      fetchNgoData();
    }
  } catch (error) {
    console.error('Error recording donation:', error);
    const resultEl = document.getElementById('donation-result');
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.className = 'result error';
  }
}

// Record spending
async function recordSpending() {
  const ngoId = document.getElementById('spending-ngo-id').value;
  const receiverId = document.getElementById('spending-receiver-id').value;
  const cause = document.getElementById('spending-cause').value;
  const amount = document.getElementById('spending-amount').value;
  const receiptHash = document.getElementById('spending-receipt-hash').value || 'RECEIPT_HASH';
  
  if (!ngoId || !receiverId || !cause || !amount) {
    alert('Please fill all fields');
    return;
  }
  
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Hash the receipt
    const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(receiptHash));
    
    const tx = await donationContract.recordSpending(
      ngoId, 
      receiverId, 
      cause, 
      amount, 
      timestamp,
      verificationHash
    );
    
    const resultEl = document.getElementById('spending-result');
    resultEl.textContent = `Transaction submitted. Hash: ${tx.hash}`;
    resultEl.className = 'result success';
    
    // Wait for the transaction to be mined
    await tx.wait();
    resultEl.textContent = 'Spending recorded successfully!';
    
    // Update UI
    fetchContractData();
    if (document.getElementById('ngo-id-input').value === ngoId) {
      fetchNgoData();
    }
  } catch (error) {
    console.error('Error recording spending:', error);
    const resultEl = document.getElementById('spending-result');
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.className = 'result error';
  }
}

// Load incoming transactions
let incomingOffset = 0;
async function loadIncomingTransactions(offset, count) {
  try {
    const totalCount = await donationContract.getIncomingDonationsCount();
    if (totalCount.toString() === '0') return;
    
    const table = document.querySelector('#incoming-table tbody');
    if (offset === 0) {
      table.innerHTML = '';
    }
    
    const max = Math.min(Number(totalCount.toString()), offset + count);
    
    for (let i = offset; i < max; i++) {
      const donation = await donationContract.getIncomingDonation(i);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${donation[0]}</td>
        <td>${donation[1]}</td>
        <td>${donation[2]}</td>
        <td>${donation[3]}</td>
        <td>${ethers.formatUnits(donation[4], 0)}</td>
        <td>${new Date(Number(donation[5]) * 1000).toLocaleString()}</td>
      `;
      
      table.appendChild(row);
    }
    
    incomingOffset = max;
    document.getElementById('load-more-incoming').disabled = incomingOffset >= Number(totalCount.toString());
  } catch (error) {
    console.error('Error loading incoming transactions:', error);
  }
}

// Load outgoing transactions
let outgoingOffset = 0;
async function loadOutgoingTransactions(offset, count) {
  try {
    const totalCount = await donationContract.getOutgoingTransactionsCount();
    if (totalCount.toString() === '0') return;
    
    const table = document.querySelector('#outgoing-table tbody');
    if (offset === 0) {
      table.innerHTML = '';
    }
    
    const max = Math.min(Number(totalCount.toString()), offset + count);
    
    for (let i = offset; i < max; i++) {
      const tx = await donationContract.getOutgoingTransaction(i);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tx[0]}</td>
        <td>${tx[1]}</td>
        <td>${tx[2]}</td>
        <td>${tx[3]}</td>
        <td>${ethers.formatUnits(tx[4], 0)}</td>
        <td>${new Date(Number(tx[5]) * 1000).toLocaleString()}</td>
      `;
      
      table.appendChild(row);
    }
    
    outgoingOffset = max;
    document.getElementById('load-more-outgoing').disabled = outgoingOffset >= Number(totalCount.toString());
  } catch (error) {
    console.error('Error loading outgoing transactions:', error);
  }
}

// Load more transactions
function loadMoreIncomingTransactions() {
  loadIncomingTransactions(incomingOffset, 5);
}

function loadMoreOutgoingTransactions() {
  loadOutgoingTransactions(outgoingOffset, 5);
}

// Helper function to shorten address
function shortenAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Set contract address manually
function setContractAddressManually() {
  const newContractAddress = prompt('Enter contract address:');
  if (newContractAddress) {
    contractAddress = newContractAddress;
    localStorage.setItem('donationContractAddress', newContractAddress);
    
    // If already connected to Ganache, initialize the contract
    if (provider && signer) {
      initializeContract();
    } else {
      // Try to connect to Ganache
      connectToGanache();
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add a global function to set contract address from external sources
window.setContractAddress = function(address) {
  contractAddress = address;
  localStorage.setItem('donationContractAddress', address);
  if (provider && signer) {
    initializeContract();
  } else {
    connectToGanache();
  }
};
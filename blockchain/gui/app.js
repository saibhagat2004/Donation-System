// Simplified version of app.js that works with local Ganache
// without requiring MetaMask

// Global variables
let provider;
let signer;
let donationContract;
// Use the Hardhat default deployed contract address
let contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

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
    
    // Create provider options with ENS disabled
    const providerOptions = {
      ensAddress: null, // Disable ENS lookups completely
      chainId: 1337,    // Hardhat/Ganache default chain ID
      name: "Ganache"   // Set network name
    };
    
    // Try both localhost and 127.0.0.1 formats
    try {
      provider = new ethers.JsonRpcProvider('http://localhost:7545', providerOptions);
      const blockNumber = await provider.getBlockNumber(); // Test the connection
      console.log('Connected to Ganache on localhost:7545. Current block:', blockNumber);
    } catch (e) {
      console.log('Trying alternative connection format...');
      provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545', providerOptions);
      const blockNumber = await provider.getBlockNumber(); // Test the connection
      console.log('Connected to Ganache on 127.0.0.1:7545. Current block:', blockNumber);
    }
    
    console.log('Connected to provider successfully');
    
    // Get accounts from Ganache
    try {
      // Get accounts directly with ethers v6 approach
      const accounts = await provider.send('eth_accounts', []);
      if (accounts && accounts.length > 0) {
        console.log('Available accounts:', accounts);
        
        // Use the same private key we're using in account-setup.html for consistency
        // This is your updated private key
        const privateKey = '0x69c3cf937091d5c71fe45ca0e738e5c54c96ddc233e8b61f0590a0081c6fd4f8';
        signer = new ethers.Wallet(privateKey, provider);
        
        // Verify the signer address matches the expected account
        const signerAddress = await signer.getAddress();
        console.log('Signer created with address:', signerAddress);
        
        if (signerAddress.toLowerCase() !== '0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0'.toLowerCase()) {
          console.warn('Warning: Signer address does not match expected account');
          console.warn('Signer:', signerAddress, 'Expected: 0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0');
        }
      } else {
        throw new Error('No accounts returned from provider');
      }
    } catch (accountError) {
      console.error('Error getting accounts:', accountError);
      // Try alternative way using provider's getSigner
      try {
        signer = provider.getSigner();
        console.log('Got signer from provider directly');
      } catch (signerError) {
        console.error('Could not get signer:', signerError);
        alert('Could not get a signer account. Please check console for details.');
        return;
      }
    }
    
    // Update UI
    try {
      const address = await signer.getAddress();
      connectionText.textContent = `Connected: ${shortenAddress(address)}`;
      connectionIndicator.className = 'indicator online';
      console.log('Using account address:', address);
    } catch (addressError) {
      console.error('Could not get signer address:', addressError);
      connectionText.textContent = 'Connected (address unknown)';
    }
    
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
    // First create with provider for read operations
    donationContract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    
    // Then connect with signer for write operations
    if (signer) {
      donationContract = donationContract.connect(signer);
      console.log('Contract initialized with signer');
      
      // Verify if the signer is the contract owner for better UX feedback
      donationContract.owner().then(ownerAddress => {
        const signerPromise = signer.getAddress();
        signerPromise.then(signerAddress => {
          if (ownerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
            console.warn(`WARNING: Signer (${signerAddress}) is not the contract owner (${ownerAddress})`);
            // Add an owner warning to the UI
            const warningEl = document.createElement('div');
            warningEl.className = 'result error';
            warningEl.style.margin = '10px 0';
            warningEl.textContent = `Warning: Your account is not the contract owner. Some operations may fail.`;
            document.querySelector('.connection-status').appendChild(warningEl);
          } else {
            console.log(`Signer (${signerAddress}) is the contract owner`);
            // Add a confirmation to the UI
            const confirmEl = document.createElement('div');
            confirmEl.className = 'result success';
            confirmEl.style.margin = '10px 0';
            confirmEl.textContent = `You are the contract owner and have full permissions.`;
            document.querySelector('.connection-status').appendChild(confirmEl);
          }
        }).catch(err => console.error('Error getting signer address:', err));
      }).catch(err => console.error('Error checking contract owner:', err));
    } else {
      console.warn('No signer available, contract is read-only');
    }
    
    contractAddressEl.textContent = contractAddress;
    
    // Fetch initial contract data
    fetchContractData();
  } catch (error) {
    console.error('Error initializing contract:', error);
    alert('Error initializing contract: ' + error.message);
  }
}

// Fetch basic contract data
async function fetchContractData() {
  try {
    // First, check if the contract exists by getting its bytecode
    const contractCode = await provider.getCode(contractAddress);
    if (contractCode === '0x') {
      console.error('No contract found at this address:', contractAddress);
      alert('No contract found at the specified address. Please verify the contract address is correct.');
      return;
    }
    
    console.log('Contract bytecode exists at address:', contractAddress);
    
    try {
      // Get owner address - we'll try/catch each call separately for better error diagnostics
      const owner = await donationContract.owner();
      ownerAddressEl.textContent = owner;
      console.log('Contract owner:', owner);
    } catch (ownerError) {
      console.error('Error fetching contract owner:', ownerError);
      ownerAddressEl.textContent = 'Error fetching owner';
    }
    
    try {
      // Get total donations
      const totalDonations = await donationContract.totalDonations();
      totalDonationsEl.textContent = ethers.formatUnits(totalDonations, 0);
      console.log('Total donations:', totalDonations.toString());
    } catch (donationsError) {
      console.error('Error fetching total donations:', donationsError);
      totalDonationsEl.textContent = 'Error fetching donations';
    }
    
    // Load initial transactions
    try {
      await loadIncomingTransactions(0, 5);
    } catch (incomingError) {
      console.error('Error loading incoming transactions:', incomingError);
    }
    
    try {
      await loadOutgoingTransactions(0, 5);
    } catch (outgoingError) {
      console.error('Error loading outgoing transactions:', outgoingError);
    }
  } catch (error) {
    console.error('Error fetching contract data:', error);
    alert('Error fetching contract data: ' + error.message + '\n\nPlease check the console for more details.');
  }
}

// Fetch NGO data
async function fetchNgoData() {
  const ngoId = document.getElementById('ngo-id-input').value.trim();
  if (!ngoId) {
    alert('Please enter an NGO ID');
    return;
  }
  
  try {
    console.log(`Fetching data for NGO: "${ngoId}"`);
    
    // First try to get the balance to verify if NGO exists
    try {
      const balance = await donationContract.getNgoBalance(ngoId, { gasLimit: 500000 });
      console.log(`NGO "${ngoId}" balance:`, balance.toString());
      document.getElementById('ngo-balance').textContent = ethers.formatUnits(balance, 0);
    } catch (balanceError) {
      console.error('Error getting NGO balance:', balanceError);
    }
    
    // Then try to get the full summary
    try {
      const options = { gasLimit: 500000 };
      const summary = await donationContract.getNgoSummary(ngoId, options);
      
      document.getElementById('ngo-total-received').textContent = ethers.formatUnits(summary[0], 0);
      document.getElementById('ngo-total-spent').textContent = ethers.formatUnits(summary[1], 0);
      document.getElementById('ngo-incoming-count').textContent = ethers.formatUnits(summary[2], 0);
      document.getElementById('ngo-outgoing-count').textContent = ethers.formatUnits(summary[3], 0);
      document.getElementById('ngo-balance').textContent = ethers.formatUnits(summary[4], 0);
      
      console.log(`NGO "${ngoId}" summary:`, {
        totalReceived: summary[0].toString(),
        totalSpent: summary[1].toString(),
        incomingCount: summary[2].toString(),
        outgoingCount: summary[3].toString(),
        currentBalance: summary[4].toString()
      });
    } catch (summaryError) {
      console.error('Error getting NGO summary, trying direct call:', summaryError);
      
      // Try direct call as fallback
      try {
        // Encode function call to getNgoSummary(string)
        const summaryAbi = ['function getNgoSummary(string memory ngoId) view returns (uint256, uint256, uint256, uint256, uint256)'];
        const summaryInterface = new ethers.Interface(summaryAbi);
        const encodedSummaryCall = summaryInterface.encodeFunctionData('getNgoSummary', [ngoId]);
        
        const rawSummaryResult = await provider.call({
          to: contractAddress,
          data: encodedSummaryCall
        });
        
        const decodedSummary = summaryInterface.decodeFunctionResult('getNgoSummary', rawSummaryResult);
        
        document.getElementById('ngo-total-received').textContent = ethers.formatUnits(decodedSummary[0], 0);
        document.getElementById('ngo-total-spent').textContent = ethers.formatUnits(decodedSummary[1], 0);
        document.getElementById('ngo-incoming-count').textContent = ethers.formatUnits(decodedSummary[2], 0);
        document.getElementById('ngo-outgoing-count').textContent = ethers.formatUnits(decodedSummary[3], 0);
        document.getElementById('ngo-balance').textContent = ethers.formatUnits(decodedSummary[4], 0);
        
        console.log(`NGO "${ngoId}" summary (direct call):`, {
          totalReceived: decodedSummary[0].toString(),
          totalSpent: decodedSummary[1].toString(),
          incomingCount: decodedSummary[2].toString(),
          outgoingCount: decodedSummary[3].toString(),
          currentBalance: decodedSummary[4].toString()
        });
      } catch (directCallError) {
        console.error('Direct call also failed:', directCallError);
        alert(`Error fetching NGO data for "${ngoId}". This NGO might not exist.`);
      }
    }
  } catch (error) {
    console.error('Error fetching NGO data:', error);
    alert(`Error fetching NGO data for "${ngoId}". Please check the NGO ID and try again.`);
  }
}

// Fetch active NGOs
async function fetchActiveNgos() {
  try {
    console.log('Fetching active NGOs...');
    const options = { gasLimit: 500000 };
    const activeNgos = await donationContract.getActiveNgoIds(100, options);
    const ngoListEl = document.getElementById('active-ngos-list');
    ngoListEl.innerHTML = '';
    
    console.log(`Found ${activeNgos.length} active NGOs:`, activeNgos);
    
    activeNgos.forEach(ngoId => {
      // Clean the NGO ID (remove any quotes or extra whitespace)
      const cleanNgoId = ngoId.trim();
      
      const item = document.createElement('div');
      item.className = 'data-list-item';
      item.textContent = cleanNgoId;
      
      // Add a click event to populate the NGO ID input field and fetch data
      item.addEventListener('click', () => {
        document.getElementById('ngo-id-input').value = cleanNgoId;
        fetchNgoData();
      });
      
      ngoListEl.appendChild(item);
      
      // Log each NGO we found
      console.log(`- Found NGO: "${cleanNgoId}"`);
    });
    
    if (activeNgos.length === 0) {
      const item = document.createElement('div');
      item.className = 'data-list-item';
      item.textContent = 'No active NGOs found';
      ngoListEl.appendChild(item);
      console.log('No active NGOs found');
    }
  } catch (error) {
    console.error('Error fetching active NGOs:', error);
    
    const ngoListEl = document.getElementById('active-ngos-list');
    ngoListEl.innerHTML = '';
    
    const errorItem = document.createElement('div');
    errorItem.className = 'data-list-item error';
    errorItem.textContent = 'Error: ' + error.message;
    ngoListEl.appendChild(errorItem);
  }
}

// Record donation
async function recordDonation() {
  const ngoId = document.getElementById('donation-ngo-id').value.trim();
  const donorId = document.getElementById('donation-donor-id').value.trim();
  const cause = document.getElementById('donation-cause').value.trim();
  const amount = document.getElementById('donation-amount').value;
  
  if (!ngoId || !donorId || !cause || !amount) {
    alert('Please fill all fields');
    return;
  }
  
  try {
    console.log(`Recording donation of ${amount} to "${ngoId}"`);
    
    const timestamp = Math.floor(Date.now() / 1000);
    const options = { gasLimit: 500000 };
    
    const tx = await donationContract.recordDonation(ngoId, donorId, cause, amount, timestamp, options);
    
    const resultEl = document.getElementById('donation-result');
    resultEl.textContent = `Transaction submitted. Hash: ${tx.hash}`;
    resultEl.className = 'result success';
    console.log(`Donation transaction submitted: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    await tx.wait();
    resultEl.textContent = 'Donation recorded successfully!';
    console.log('Donation transaction confirmed!');
    
    // Update NGO input field with this NGO ID for easy checking
    document.getElementById('ngo-id-input').value = ngoId;
    
    // Update UI
    fetchContractData();
    fetchNgoData();
    fetchActiveNgos();
  } catch (error) {
    console.error('Error recording donation:', error);
    const resultEl = document.getElementById('donation-result');
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.className = 'result error';
  }
}

// Record spending
async function recordSpending() {
  const ngoId = document.getElementById('spending-ngo-id').value.trim();
  const receiverId = document.getElementById('spending-receiver-id').value.trim();
  const cause = document.getElementById('spending-cause').value.trim();
  const amount = document.getElementById('spending-amount').value;
  const receiptHash = document.getElementById('spending-receipt-hash').value.trim() || 'RECEIPT_HASH';
  
  if (!ngoId || !receiverId || !cause || !amount) {
    alert('Please fill all fields');
    return;
  }
  
  try {
    console.log(`Recording spending of ${amount} from "${ngoId}" to "${receiverId}"`);
    
    // Check if we're the contract owner
    try {
      const owner = await donationContract.owner();
      const signerAddress = await signer.getAddress();
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        console.warn(`WARNING: Your address (${signerAddress}) is not the contract owner (${owner})`);
        alert(`Only the contract owner (${owner}) can record spending. Your address is ${signerAddress}. Transaction may fail.`);
      }
    } catch (ownerError) {
      console.error('Error checking owner:', ownerError);
    }
    
    // First verify the NGO has enough balance
    try {
      const balance = await donationContract.getNgoBalance(ngoId);
      if (balance < amount) {
        alert(`NGO "${ngoId}" has insufficient balance: ${balance} < ${amount}`);
        console.warn(`NGO has insufficient balance: ${balance} < ${amount}`);
        return;
      }
      console.log(`NGO "${ngoId}" has sufficient balance: ${balance} >= ${amount}`);
    } catch (balanceError) {
      console.error('Error checking NGO balance:', balanceError);
      alert(`Could not verify NGO "${ngoId}" balance. This NGO might not exist.`);
      return;
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    // Hash the receipt
    const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(receiptHash));
    
    const options = { gasLimit: 500000 };
    const tx = await donationContract.recordSpending(
      ngoId, 
      receiverId, 
      cause, 
      amount, 
      timestamp,
      verificationHash,
      options
    );
    
    const resultEl = document.getElementById('spending-result');
    resultEl.textContent = `Transaction submitted. Hash: ${tx.hash}`;
    resultEl.className = 'result success';
    console.log(`Spending transaction submitted: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    await tx.wait();
    resultEl.textContent = 'Spending recorded successfully!';
    console.log('Spending transaction confirmed!');
    
    // Update NGO input field with this NGO ID for easy checking
    document.getElementById('ngo-id-input').value = ngoId;
    
    // Update UI
    fetchContractData();
    fetchNgoData();
  } catch (error) {
    console.error('Error recording spending:', error);
    const resultEl = document.getElementById('spending-result');
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.className = 'result error';
    
    if (error.message.includes("Only owner")) {
      resultEl.textContent += '. You must be the contract owner to record spending.';
    } else if (error.message.includes("Insufficient NGO balance")) {
      resultEl.textContent += '. The NGO does not have enough funds.';
    }
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
async function setContractAddressManually() {
  const newContractAddress = prompt('Enter contract address:');
  if (newContractAddress && newContractAddress.startsWith('0x')) {
    // Validate the address by checking if there's code at that address
    if (provider) {
      try {
        const code = await provider.getCode(newContractAddress);
        if (code === '0x') {
          alert('Warning: No contract found at this address. Are you sure this is correct?');
          const confirm = window.confirm('No contract code found. Do you want to continue anyway?');
          if (!confirm) {
            return;
          }
        } else {
          console.log('Contract code found at address:', newContractAddress);
        }
      } catch (error) {
        console.error('Error checking contract code:', error);
      }
    }
    
    contractAddress = newContractAddress;
    localStorage.setItem('donationContractAddress', newContractAddress);
    contractAddressEl.textContent = newContractAddress;
    console.log('Contract address set to:', newContractAddress);
    
    // If already connected to Ganache, initialize the contract
    if (provider && signer) {
      initializeContract();
    } else {
      // Try to connect to Ganache
      connectToGanache();
    }
  } else if (newContractAddress !== null) {
    alert('Please enter a valid contract address starting with 0x');
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
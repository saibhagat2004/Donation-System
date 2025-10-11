# Blockchain Integration Documentation

## Overview
This donation system now includes complete blockchain transparency integration that records all donations and withdrawals on a local Ganache blockchain, providing immutable transaction records and public transparency.

## Architecture

### Components
1. **Python Banking System** (`Python-Bank-Project/`)
   - Enhanced with blockchain integration via `blockchain_integration.py`
   - Records donations and withdrawals to smart contract
   - Manages NGO balances and transaction history

2. **Smart Contract** (`blockchain/contracts/Donation.sol`)
   - Records donation and spending transactions
   - Maintains NGO balances
   - Provides transparency functions for public access

3. **React Frontend Integration**
   - `BlockchainService.js` - Main service for blockchain connectivity
   - `BlockchainTransactions.jsx` - Full transactions dashboard
   - `NgoBlockchainDetails.jsx` - Individual NGO transaction view
   - `BlockchainWidget.jsx` - Embeddable transparency widget

## Setup Instructions

### 1. Blockchain Setup (Ganache)
```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Start Ganache (if not already running)
npm run start-ganache
# OR manually start Ganache CLI on port 7545

# Deploy smart contract
npm run deploy

# Start blockchain GUI (optional)
npm run gui
```

### 2. Backend Integration (Python)
```bash
# Navigate to Python banking project
cd Python-Bank-Project

# Install required packages
pip install web3

# Update blockchain configuration in blockchain_integration.py
# Ensure contract address matches deployed contract

# Start banking server
python app.py
```

### 3. Frontend Integration (React)
```bash
# Navigate to frontend directory
cd frontend

# Install ethers.js for blockchain connectivity
npm install ethers@^6.0.0

# For local development - no additional config needed
npm run dev

# For production deployment - see Environment Configuration section
```

## Usage

### Accessing Blockchain Features

1. **Main Transparency Dashboard**
   - Navigate to `/blockchain` in your application
   - View all donations and spending across all NGOs
   - Filter by transaction type (incoming/outgoing)
   - Filter by specific NGO

2. **Individual NGO Details**
   - Navigate to `/blockchain/ngo/{ngoId}` 
   - View complete financial history for specific NGO
   - See current balance, total received, total spent
   - Detailed transaction list with timestamps

3. **Embedded Widget**
   - Automatically appears on campaign detail pages
   - Shows recent transactions for the campaign's NGO
   - Provides quick link to full transparency view

### Transaction Flow

1. **Donation Process**
   - User makes donation through React frontend
   - Payment processed via Cashfree/payment gateway
   - Backend records donation in database
   - Backend calls `record_donation_on_blockchain()` to record on blockchain
   - Transaction appears in blockchain transparency views

2. **Withdrawal Process**
   - NGO requests withdrawal through banking system
   - Backend processes withdrawal from NGO account
   - Backend calls `record_spending_on_blockchain()` to record spending
   - Withdrawal appears as outgoing transaction on blockchain

## Environment Configuration

### Local Development
Default configuration works with:
- Ganache running on `http://localhost:7545`
- Contract deployed at specified address
- No additional environment variables needed

### Production Deployment

#### Option 1: Hosted Website + Local Blockchain (via ngrok)
```bash
# Install ngrok globally
npm install -g ngrok

# Expose local Ganache to internet
ngrok http 7545

# Set environment variables in your hosting platform (Render, Vercel, etc.)
VITE_BLOCKCHAIN_RPC_URL=https://abc123.ngrok.io
VITE_CONTRACT_ADDRESS=0x9fC0c4B491bC255f1d1486aD586d404b425afD8F
VITE_CHAIN_ID=1337
```

#### Option 2: Hosted Blockchain Service
```bash
# Use a hosted Ethereum-compatible blockchain
VITE_BLOCKCHAIN_RPC_URL=https://your-hosted-blockchain.com
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_CHAIN_ID=YourChainId
```

### Environment Variables (.env)
Create `.env.local` file in frontend directory:
```env
# Blockchain Configuration
VITE_BLOCKCHAIN_RPC_URL=http://localhost:7545
VITE_CONTRACT_ADDRESS=0x9fC0c4B491bC255f1d1486aD586d404b425afD8F
VITE_CHAIN_ID=1337
```

## API Reference

### BlockchainService Methods

#### Connection Management
- `initialize()` - Initialize connection to blockchain
- `getConnectionStatus()` - Get connection status and basic stats

#### Transaction Retrieval
- `getAllTransactions(limit)` - Get all transactions across platform
- `getAllIncomingTransactions(limit)` - Get all incoming donations
- `getAllOutgoingTransactions(limit)` - Get all outgoing spending
- `getNgoTransactions(ngoId, limit)` - Get all transactions for specific NGO
- `getNgoIncomingTransactions(ngoId, limit)` - Get NGO donations
- `getNgoOutgoingTransactions(ngoId, limit)` - Get NGO spending

#### NGO Information
- `getActiveNgos()` - Get list of NGOs with blockchain activity
- `getNgoSummary(ngoId)` - Get NGO balance and summary info

### Smart Contract Functions
- `recordDonation(ngoId, donorId, amount, cause)` - Record donation
- `recordSpending(ngoId, receiverId, amount, description)` - Record spending
- `getNgoBalance(ngoId)` - Get current NGO balance
- `getIncomingDonation(id)` - Get donation details
- `getOutgoingTransaction(id)` - Get spending details

## Integration Examples

### Adding Blockchain Widget to Any Page
```jsx
import BlockchainWidget from '../components/BlockchainWidget';

// Show specific NGO transactions
<BlockchainWidget ngoId="ngo123" showAllTransactions={false} />

// Show recent platform activity
<BlockchainWidget showAllTransactions={true} />
```

### Custom Transaction Display
```jsx
import BlockchainService from '../services/BlockchainService';

// Fetch and display transactions
const fetchTransactions = async () => {
  await BlockchainService.initialize();
  const transactions = await BlockchainService.getNgoTransactions('ngo123', 10);
  // Display transactions
};
```

## Troubleshooting

### Common Issues

1. **"Blockchain Offline" Message**
   - Ensure Ganache is running on correct port (7545)
   - Check network configuration in BlockchainService.js
   - Verify contract is deployed

2. **No Transactions Appearing**
   - Check if banking system is calling blockchain integration methods
   - Verify contract address matches deployed contract
   - Ensure transactions are being recorded via Python backend

3. **Environment Configuration Issues**
   - Verify environment variables are set correctly
   - Check if using VITE_ prefix for Vite environment variables
   - Ensure ngrok URL is active (if using ngrok)

### Development Tips

1. **Testing Blockchain Integration**
   ```bash
   # Test contract deployment
   cd blockchain && npm run test

   # Check blockchain GUI for transaction history
   cd blockchain && npm run gui

   # Test Python integration
   cd Python-Bank-Project && python test-exports.js
   ```

2. **Monitoring Transactions**
   - Use Ganache GUI to monitor blockchain state
   - Check browser console for BlockchainService errors
   - Verify transaction IDs in both database and blockchain

## Security Considerations

1. **Private Key Management**
   - Contract owner private key should be secured
   - Use environment variables for sensitive configuration
   - Consider multi-signature wallets for production

2. **Network Security**
   - Use HTTPS for production blockchain endpoints
   - Secure ngrok URLs with authentication if needed
   - Implement rate limiting for blockchain calls

3. **Data Validation**
   - Validate all blockchain data before display
   - Handle network failures gracefully
   - Implement proper error handling

## Future Enhancements

1. **Enhanced Features**
   - Real-time transaction notifications
   - Advanced filtering and search
   - Export transaction reports
   - Mobile-responsive improvements

2. **Scaling Considerations**
   - Migration to public blockchain networks
   - IPFS integration for document storage
   - Advanced analytics and reporting
   - Multi-chain support

## Support

For issues and questions:
1. Check troubleshooting section above
2. Review blockchain GUI for transaction status
3. Check console logs for detailed error messages
4. Verify all components are running (Ganache, backend, frontend)
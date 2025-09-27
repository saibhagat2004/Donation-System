# Viewing Blockchain Data in the Donation System

This document explains how to set up, deploy, and interact with the blockchain component of the Donation System.

## Prerequisites

Make sure you have these tools installed:
- Node.js (v14 or newer)
- npm (comes with Node.js)
- MetaMask browser extension

## Setup Instructions

### Step 1: Install Dependencies

First, make sure all dependencies are installed:

```bash
# Navigate to the blockchain directory
cd blockchain

# Install dependencies
npm install
```

### Step 2: Install and Run Ganache

Ganache is a personal blockchain for Ethereum development that lets you see detailed blockchain activities.

```bash
# Install Ganache globally
npm install -g ganache

# Run Ganache with these settings
ganache --port 7545 --deterministic
```

Keep this terminal window open. Ganache is now running on port 7545 with predictable accounts.

### Step 3: Deploy the Smart Contract

Open a new terminal window and deploy the contract:

```bash
# Navigate to the blockchain directory
cd blockchain

# Deploy the contract to Ganache
npx hardhat run --network ganache scripts/deploy-to-ganache.js
```

After successful deployment, you'll see a message with the contract address. Copy this address as you'll need it later.

### Step 4: Start the Web Interface

In another terminal:

```bash
# Navigate to the blockchain directory
cd blockchain

# Start the web server
node server.js
```

### Step 5: Configure MetaMask

1. Open MetaMask in your browser
2. Add a new network with these settings:
   - Network Name: Ganache
   - RPC URL: http://127.0.0.1:7545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. Import a Ganache account:
   - In your Ganache terminal, find the first account and its private key
   - In MetaMask, click "Import Account" and paste the private key

### Step 6: Use the Web Interface

1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet" to connect MetaMask
3. Click "Set Contract Address" and enter the contract address from Step 3
4. Now you can interact with the blockchain:
   - Record donations
   - Record spending
   - View NGO summaries
   - See transaction history

## What You Can Do

### Record Donations

1. Fill in the "Record Donation" form:
   - NGO ID: The ID of the NGO receiving the donation
   - Donor ID: The ID of the donor
   - Cause: The purpose of the donation
   - Amount: The amount donated (in rupees)
2. Click "Record Donation"
3. Approve the transaction in MetaMask

### Record Spending

1. Fill in the "Record Spending" form:
   - NGO ID: The ID of the NGO spending funds
   - Receiver ID: The ID of the recipient
   - Cause: The purpose of the spending
   - Amount: The amount spent (in rupees)
   - Receipt Hash: Optional identifier for the receipt
2. Click "Record Spending"
3. Approve the transaction in MetaMask

### View NGO Data

1. Enter an NGO ID in the "NGO Data" section
2. Click "Fetch Data"
3. View the summary showing:
   - Total received
   - Total spent
   - Current balance
   - Number of incoming and outgoing transactions

### View Active NGOs

Click "Fetch Active NGOs" to see all NGOs that have received donations.

### View Transactions

The "Transactions" tab shows all incoming donations and outgoing spending transactions recorded on the blockchain.

## Understanding the Blockchain Data

### Transaction Flow

1. **Donation Recording**: When a donation is made, it's recorded on the blockchain with details including NGO ID, donor ID, amount, and purpose.

2. **NGO Balance Update**: The donation automatically updates the NGO's balance in the smart contract.

3. **Spending Recording**: When an NGO spends funds, this transaction is also recorded on the blockchain with full details.

4. **Verification**: All transactions are immutable and can be verified by anyone with access to the blockchain.

### Viewing Raw Blockchain Data in Ganache

For a deeper look at the blockchain:

1. Look at the Ganache terminal or UI to see all transactions
2. Each transaction shows:
   - Transaction hash
   - Block number
   - From/to addresses
   - Gas used
   - Event logs

## Troubleshooting

- **MetaMask Connection Issues**: Make sure Ganache is running and you've configured MetaMask with the correct settings
- **Transaction Failures**: Check that your account has enough ETH for gas fees
- **Contract Not Found**: Verify you've entered the correct contract address in the UI

For more detailed instructions, refer to the [Hardhat Documentation](https://hardhat.org/getting-started/) and [Ganache Documentation](https://www.trufflesuite.com/docs/ganache/overview).
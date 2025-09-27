# Blockchain Data Visualization Guide for Donation System

This guide provides step-by-step instructions for setting up and using the blockchain component of the Donation System. You will learn how to view transaction data, balances, and interact with the smart contract using both Ganache and our web interface.

## 1. Quick Start - For Windows Users

We've created a simple menu-driven setup script to make everything easier:

1. Open a command prompt in the `blockchain` directory
2. Run the setup script:
   ```
   blockchain-setup.bat
   ```
3. Follow the on-screen menu:
   - Option 1: Install dependencies (do this first)
   - Option 2: Start Ganache and deploy the contract
   - Option 3: Start the web interface
   - Option 4: Exit

## 2. Quick Start - For Mac/Linux Users

We've created a simple menu-driven setup script for Mac/Linux users:

1. Open a terminal in the `blockchain` directory
2. Make the script executable:
   ```bash
   chmod +x blockchain-setup.sh
   ```
3. Run the setup script:
   ```bash
   ./blockchain-setup.sh
   ```
4. Follow the on-screen menu options (same as Windows version)

## 3. Manual Setup (Alternative Approach)

If you prefer to run commands manually or the setup script doesn't work for you:

### Step 1: Install Dependencies

```bash
# Navigate to the blockchain directory
cd blockchain

# Install dependencies
npm install
```

### Step 2: Start Ganache

Ganache is a personal blockchain for Ethereum development:

```bash
# Install Ganache globally if you don't have it
npm install -g ganache

# Start Ganache
ganache --port 7545 --deterministic
```

Keep this terminal window open.

### Step 3: Deploy the Smart Contract

In a new terminal:

```bash
# Navigate to blockchain directory
cd blockchain

# Deploy the contract
npx hardhat run scripts/deploy-to-ganache.js --network ganache
```

Note the contract address displayed in the terminal. You'll need it later.

### Step 4: Start the Web Interface

In a new terminal:

```bash
# Navigate to blockchain directory
cd blockchain

# Start the web server
node server.js
```

Open http://localhost:3000 in your browser.

## 4. Setting Up MetaMask

To interact with the blockchain:

1. Install the MetaMask browser extension if you don't already have it
2. Add a new network in MetaMask:
   - Network Name: Ganache
   - RPC URL: http://127.0.0.1:7545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. Import a Ganache account:
   - In your Ganache terminal, you'll see a list of accounts with private keys
   - In MetaMask, click on your account icon → Import Account
   - Paste the private key of the first Ganache account
   - Click "Import"

## 5. Using the Web Interface

1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet" to connect your MetaMask account
3. Click "Set Contract Address" and enter the contract address from step 3

You can now:

- **Record Donations**: Enter NGO ID, donor ID, cause, and amount to record a donation on the blockchain
- **Record Spending**: Enter spending details with verification receipts
- **View NGO Data**: See total received, total spent, balance, and transaction counts for each NGO
- **View Transactions**: Browse all incoming and outgoing transactions

## 6. Using Ganache for Raw Blockchain Data

Ganache provides deeper insight into the blockchain:

1. If using Ganache CLI (command line), check the terminal output
2. If using Ganache UI (desktop app):
   - Blocks: See all blocks mined with timestamps
   - Transactions: View all transaction details
   - Contracts: See your deployed contract and interact with it
   - Events: See all events emitted by your contract

## 7. Understanding the Data Flow

1. **Recording a Donation**:
   - When you record a donation, a transaction is sent to the smart contract
   - The contract updates the NGO's balance
   - Events are emitted with donation details
   - The transaction is recorded on the blockchain forever

2. **Viewing NGO Data**:
   - The web interface queries the smart contract for NGO information
   - The contract calculates totals from all recorded transactions
   - No data is stored in a traditional database - everything is on the blockchain

3. **Recording Spending**:
   - Similar to donations, spending is recorded permanently
   - Each spending transaction reduces the NGO's balance
   - A verification hash can be included for receipt validation

## 8. Troubleshooting

- **"No contract address found" message**:
  - Make sure you've deployed the contract (Step 2 and 3)
  - Check that the contract-address.json file was created

- **"Invalid address" in MetaMask**:
  - Make sure you're using the correct RPC URL (http://127.0.0.1:7545)
  - Verify that Ganache is running

- **Transaction failures**:
  - Check that your MetaMask account has enough ETH for gas
  - Verify that the function requirements are met (e.g., sufficient NGO balance for spending)

- **"Error connecting wallet"**:
  - Refresh the page and try again
  - Check that MetaMask is unlocked and connected to the Ganache network

## 9. For Developers

If you want to modify the smart contract:

1. Edit the file in `contracts/Donation.sol`
2. Compile the contract:
   ```
   npx hardhat compile
   ```
3. Deploy the updated contract:
   ```
   npx hardhat run scripts/deploy-to-ganache.js --network ganache
   ```
4. Update the contract address in the web interface

## 10. Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Ganache Documentation](https://www.trufflesuite.com/docs/ganache/overview)
- [MetaMask Documentation](https://docs.metamask.io/guide/)
- [Ethereum Smart Contracts](https://ethereum.org/en/developers/docs/smart-contracts/)
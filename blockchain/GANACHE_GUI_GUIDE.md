# Viewing Blockchain Data with Ganache

This guide explains how to use Ganache to view the blockchain data for the Donation System.

## What is Ganache?

Ganache is a personal blockchain for Ethereum development that runs on your desktop. It provides 10 accounts with 100 ETH each by default, and allows you to see detailed information about your blockchain activity including:

- Accounts and balances
- Block information
- Transactions
- Contract deployments
- Contract state and events
- Gas costs

## Setting Up Ganache

1. Make sure you have Ganache installed:
```bash
# If not already installed
npm install -g ganache
```

2. Start Ganache:
```bash
ganache --port 7545 --deterministic
```

Ganache will start with a set of accounts that have test ETH. The `--deterministic` flag ensures you get the same accounts each time.

## Deploying the Contract with Hardhat

1. Configure Hardhat to use Ganache:
   - The `hardhat.config.js` file already includes a Ganache network configuration

2. Deploy the contract:
```bash
# From the blockchain directory
npx hardhat run --network ganache scripts/deploy.js
```

3. The contract address will be displayed in the console. Copy this address.

## Viewing Contract Data in Ganache UI

If you prefer a graphical interface:

1. Download Ganache UI from [https://www.trufflesuite.com/ganache](https://www.trufflesuite.com/ganache)

2. Create a new workspace or use an existing one

3. Configure workspace to use port 7545

4. After deploying your contract, you can see:
   - The transaction that created the contract
   - Contract state
   - Events emitted by the contract

## Using the Web Interface

1. Start the web server:
```bash
# From the blockchain directory
node server.js
```

2. Open http://localhost:3000 in your browser

3. Connect MetaMask to Ganache:
   - In MetaMask, add a new network with:
     - Network Name: Ganache
     - RPC URL: http://localhost:7545
     - Chain ID: 1337
     - Currency Symbol: ETH

4. Import a Ganache account to MetaMask:
   - Get the private key of the first account from Ganache
   - In MetaMask, click "Import Account" and paste the private key

5. In the web interface:
   - Click "Connect Wallet"
   - Click "Set Contract Address" and enter the contract address from deployment

6. Now you can:
   - View NGO data
   - Record donations and spending
   - See transaction history

## Monitoring Blockchain Events

Ganache lets you see all transactions and events in real-time. After performing actions in the UI:

1. Check the "Transactions" tab in Ganache
2. Look at "Events" for your contract to see emitted events
3. Examine the contract state by selecting your contract and viewing its storage

## Troubleshooting

- **Gas Issues**: If you see "insufficient funds for gas", make sure you're using an account with enough ETH
- **Connection Issues**: Ensure Ganache is running before deploying or using the UI
- **Contract Errors**: Check the console for detailed error messages
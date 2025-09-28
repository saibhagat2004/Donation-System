# Blockchain Module for Donation System

This module contains the smart contracts, deployment scripts, and testing tools for the Donation System blockchain component.

## Setup and Deployment

### Prerequisites

- Node.js (v14+)
- Ganache (local Ethereum blockchain)
- Hardhat (development environment)

### Installation

```bash
# Install dependencies
npm install
```

### Starting Ganache

```bash
# Option 1: Using Ganache CLI
ganache --port 7545 --deterministic

# Option 2: Using our helper script
./fix-ganache-connection.sh
```

### Compiling the Contract

```bash
npx hardhat compile
```

### Deploying the Contract

```bash
# Option 1: Standard deployment
npx hardhat run --network ganache scripts/deploy.js

# Option 2: Direct deployment (recommended for troubleshooting)
npx hardhat run scripts/deploy-direct.js

# Option 3: Using the deployment script
./deploy-and-verify.bat   # Windows
./deploy-and-verify.sh    # Linux/Mac
```

## Testing Tools

This module includes several testing tools to help verify your contract deployment and blockchain connection:

### 1. Simple Tester (gui/simple-tester.html)

A minimalist tool for checking:
- Ethers.js loading
- Ganache connection
- Account access
- Basic contract function calls

### 2. Enhanced Tester (gui/enhanced-tester.html)

A more comprehensive testing tool with:
- Detailed account information
- Contract verification
- Connection diagnostics
- Network information

### 3. Contract Verifier (gui/contract-verifier.html)

A specialized tool for verifying contract deployment:
- Checks contract bytecode at address
- Verifies key contract functions
- Provides deployment information

## Troubleshooting Tools

If you encounter issues with deployment or contract interaction:

### 1. Account Checking

```bash
# Check available Ganache accounts and balances
npx hardhat run scripts/check-ganache-accounts.js
```

### 2. Connection Fixing

```bash
# Windows
fix-ganache-connection.bat

# Linux/Mac
./fix-ganache-connection.sh
```

## Known Issues and Solutions

### Insufficient Funds Error

If you see "insufficient funds for gas * price + value", check:
1. Which accounts are available in your Ganache instance
2. Whether you're using the correct private key in deployment scripts
3. If the account has enough ETH balance

Solution: Use `scripts/check-ganache-accounts.js` to verify account information.

### ENS Lookup Errors

If you see "network does not support ENS", this is due to ethers.js v6+ attempting ENS lookups by default.

Solution: All our tools have been updated to disable ENS lookups with:

```javascript
const provider = new ethers.JsonRpcProvider(url, {
  ensAddress: null,
  chainId: 1337
});
```

### Contract Not Found Error

If verification shows "No contract found at this address", check:
1. Whether the contract was successfully deployed
2. If you're using the correct contract address
3. Whether you're connected to the same network where the contract was deployed

Solution: Review the deployment output and verify the contract address.

## Documentation

For more detailed information, see:

- [ENS_FIX_README.md](./gui/ENS_FIX_README.md) - Information on ENS lookup fixes
- [GANACHE_GUI_GUIDE.md](./GANACHE_GUI_GUIDE.md) - Guide for using Ganache GUI
- [DEPLOYMENT_FIX.md](./DEPLOYMENT_FIX.md) - Manual deployment workarounds
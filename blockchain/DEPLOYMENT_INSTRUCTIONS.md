# Deployment Instructions

## Quick Start

1. Make sure Ganache is running on port 7545
2. Run the deployment script:

**For Windows:**
```
deploy-simple.bat
```

**For Linux/Mac:**
```
chmod +x deploy-simple.sh
./deploy-simple.sh
```

## Using Your Custom Account

The deployment script has been configured to use this account:

```
Address: 0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0
Private Key: 0x69c3cf937091d5c71fe45ca0e738e5c54c96ddc233e8b61f0590a0081c6fd4f8
```

This account must have enough ETH to deploy the contract.

## After Deployment

After successful deployment:

1. The contract address will be saved in `contract-address.json`
2. Open `gui/simple-tester.html` or `gui/contract-verifier.html` to verify the contract
3. You can then use the main application to interact with your contract

## Troubleshooting

### "Insufficient funds for gas"

This means your account doesn't have enough ETH. Make sure:

1. The account listed in the deployment output matches your expected account
2. The account has enough ETH (at least 0.1 ETH recommended)
3. If using Ganache UI, make sure your account is pre-funded

### "Cannot connect to Ganache"

Make sure Ganache is running with:

```
ganache --port 7545
```

Or use the Ganache GUI application and configure it to use port 7545.

### "Invalid network object"

This is usually an issue with ethers.js compatibility. Make sure:

1. You're using the simplified deployment script (deploy-simple.js)
2. Your node_modules are properly installed (`npm install` in the blockchain directory)

### "RPC Error: Fee estimation failed"

This can happen if:
1. The contract has syntax errors
2. Gas limit is too low for contract deployment
3. Network is congested (not usually an issue with local Ganache)

Check your contract code and try increasing gas limit in the deployment script.
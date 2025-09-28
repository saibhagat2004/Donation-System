#!/bin/bash
# Helper script to deploy the Donation contract to Ganache

# Make sure Ganache is running
echo "Checking if Ganache is running on port 7545..."

# Try to connect to Ganache
curl -s http://localhost:7545 > /dev/null
if [ $? -ne 0 ]; then
    echo "Error: Ganache is not running on port 7545."
    echo "Please start Ganache and try again."
    exit 1
fi

echo "Ganache is running. Proceeding with deployment..."

# Run the Hardhat deployment script
echo "Deploying contract to Ganache..."
npx hardhat run scripts/deploy-to-ganache-fixed.js

# Check if deployment was successful
if [ $? -ne 0 ]; then
    echo "Error: Contract deployment failed."
    echo "Please check the error messages above and try again."
    exit 1
fi

echo "Contract deployment completed."
echo "You can now open contract-verifier.html to verify the deployment."
echo "Or go directly to index.html to use the main interface."
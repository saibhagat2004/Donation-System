#!/bin/bash
# Simple script to deploy contract with explicit account

echo "Simple Contract Deployment"
echo "======================"
echo

echo "Checking if Ganache is running..."
nc -z 127.0.0.1 7545 &> /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Cannot connect to Ganache on port 7545."
  echo "Please make sure Ganache is running first."
  exit 1
fi

echo "Ganache appears to be running!"
echo

echo "Deploying contract with specified account..."
node scripts/deploy-simple.js

if [ $? -ne 0 ]; then
  echo
  echo "Deployment failed! Check the error message above."
  echo
else
  echo
  echo "Deployment successful!"
  echo
  echo "You can now use the tools to verify your contract:"
  echo "- Open gui/simple-tester.html"
  echo "- Open gui/contract-verifier.html"
fi

echo "Press Enter to continue..."
read
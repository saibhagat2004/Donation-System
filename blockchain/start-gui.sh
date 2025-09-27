#!/bin/bash

# Start Ganache in the background
echo "Starting Ganache..."
ganache --port 7545 --deterministic --miner.blockGasLimit 12000000 &
GANACHE_PID=$!

# Wait for Ganache to start
echo "Waiting for Ganache to start..."
sleep 3

# Deploy the contract
echo "Deploying the contract to Ganache..."
npx hardhat run scripts/deploy-to-ganache.js --network ganache

# Wait for user to press Ctrl+C
echo ""
echo "Press Ctrl+C to stop Ganache and the web server"
trap "kill $GANACHE_PID; exit" INT
wait
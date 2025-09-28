#!/bin/bash
# Fix Ganache connection issues

echo "=== Ganache Connection Fix Tool ==="
echo "This script will help resolve connection issues with Ganache"
echo ""

# Check if Ganache is installed
if ! command -v ganache &> /dev/null; then
    echo "❌ Ganache not found! Installing it globally..."
    npm install -g ganache
    echo ""
fi

# Check if any process is using port 7545
if command -v lsof &> /dev/null; then
    PORT_CHECK=$(lsof -i :7545)
    if [ ! -z "$PORT_CHECK" ]; then
        echo "⚠️ Process already using port 7545: "
        echo "$PORT_CHECK"
        echo ""
        echo "Attempting to close existing Ganache processes..."
        pkill -f ganache
        echo "Waiting 5 seconds..."
        sleep 5
    fi
else
    echo "⚠️ Could not check for processes using port 7545 (lsof not available)"
    echo "If you have issues, manually check and kill any processes using port 7545"
    echo ""
fi

# Check if we should just check accounts or start Ganache
if [ "$1" == "check-only" ]; then
    echo "🔍 Checking Ganache accounts without starting a new instance..."
    echo "Make sure Ganache is already running on port 7545"
    echo ""
    
    # Run the account check script
    npx hardhat run scripts/check-ganache-accounts.js
    
    echo ""
    echo "✅ Account check complete"
    exit 0
fi

# Start Ganache with proper config
echo "🚀 Starting Ganache with explicit host binding..."
echo "This allows connections from both localhost and 127.0.0.1"
echo ""
echo "While Ganache is running, you can open another terminal and run:"
echo "./fix-ganache-connection.sh check-only"
echo "to check the available accounts and their balances."
echo ""

ganache --port 7545 --host 0.0.0.0 --deterministic

# Note: The script will stay running with Ganache active
# User needs to press Ctrl+C to exit
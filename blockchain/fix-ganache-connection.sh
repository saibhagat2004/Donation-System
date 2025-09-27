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

# Start Ganache with proper config
echo "🚀 Starting Ganache with explicit host binding..."
echo "This allows connections from both localhost and 127.0.0.1"
ganache --port 7545 --host 0.0.0.0 --deterministic

# Note: The script will stay running with Ganache active
# User needs to press Ctrl+C to exit
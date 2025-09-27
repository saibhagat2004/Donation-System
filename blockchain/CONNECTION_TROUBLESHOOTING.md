# Connection Troubleshooting Guide

This guide will help you solve the connection issues with Ganache.

## Step 1: Restart Everything

First, let's restart everything in the correct order:

1. Close all terminal windows running Ganache or the server
2. Open a new terminal window
3. Start Ganache:
   ```
   ganache --port 7545 --deterministic
   ```
4. Open another terminal window
5. Start the web server:
   ```
   cd blockchain
   node server.js
   ```

## Step 2: Use the Connection Tester

I've created a special diagnostic tool to help identify connection issues:

1. Open your browser and go to:
   ```
   http://localhost:3000/connection-tester.html
   ```

2. Enter your contract address in the field (it should be auto-filled if saved in localStorage)

3. Click "Test Connection" to verify Ganache is reachable

4. Click "Get Accounts" to verify account access

5. Click "Test Owner" to verify contract access

If any of these steps fail, the tester will show detailed error messages.

## Step 3: Use the Updated Web Interface

The main web interface has been updated with more robust connection handling:

1. Open your browser and go to:
   ```
   http://localhost:3000
   ```

2. Click "Connect to Ganache" button

3. Click "Set Contract Address" and enter your contract address:
   ```
   0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
   ```

4. You should now see contract information loaded

## Step 4: Alternative Connection Methods

If you're still having issues:

1. Try using "127.0.0.1" instead of "localhost" in the connection tester

2. Check if Ganache is actually listening on port 7545:
   ```
   netstat -an | findstr 7545
   ```

3. Verify your contract address is correct:
   ```
   cat contract-address.json
   ```

4. Try a new browser window or incognito mode to avoid cached data

## Explanation of Fixes

The following improvements have been made to fix connection issues:

1. Added CORS headers to the server to allow browser connections
2. Updated the connection logic to try multiple connection methods
3. Added more detailed error messages
4. Created a connection tester tool for diagnosis
5. Fixed the mismatch between HTML and JS files

After following these steps, you should be able to successfully connect to your local blockchain and interact with your contract.
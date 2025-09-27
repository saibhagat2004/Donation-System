# Blockchain Connection Troubleshooting Guide

If you're experiencing issues connecting to the Ganache blockchain or interacting with your smart contract, follow this comprehensive troubleshooting guide.

## Common Issues and Solutions

### 1. "Failed to connect to Ganache" Error

**Symptoms:**
- "Failed to connect to Ganache" message in the web interface
- Connection timeouts when trying to interact with the contract

**Solutions:**
- Ensure Ganache is actually running: `ganache --port 7545 --deterministic`
- Try both "localhost" and "127.0.0.1" in your connection URLs
- Check if another process is using port 7545 with: `netstat -an | grep 7545` (Linux/Mac) or `netstat -an | findstr 7545` (Windows)
- Restart Ganache and the web server
- Check for firewall blocking the port

### 2. "ethers is not defined" Error

**Symptoms:**
- JavaScript console shows "ethers is not defined" 
- Contract functions fail to execute

**Solutions:**
- Verify that the ethers.js library is being loaded correctly in the HTML
- Check the browser console for any script loading errors
- Try clearing browser cache or using incognito mode
- Ensure the correct version of ethers is referenced (we use v6)
- Check network connectivity to CDN services

### 3. Contract Interaction Issues

**Symptoms:**
- "Error initializing contract" messages
- Contract functions return errors or don't work

**Solutions:**
- Verify the contract address is correct: check `contract-address.json`
- Make sure the contract ABI matches the deployed contract
- Ensure the contract was deployed successfully
- Check that you have sufficient funds in your Ganache account
- Use the connection tester tool to verify contract accessibility

### 4. Cross-Origin (CORS) Issues

**Symptoms:**
- Browser console shows CORS errors
- API requests fail with cross-origin errors

**Solutions:**
- The server is configured with CORS headers to allow browser requests
- If you're hosting the frontend separately, update the CORS settings
- Try accessing the application from the same origin as the server
- Check browser extensions that might be blocking requests

## Step-by-Step Diagnosis

### Step 1: Verify Ganache Is Running

Run this in a terminal:
```
curl http://localhost:7545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

You should see a response with a block number. If not, restart Ganache:
```
ganache --port 7545 --deterministic
```

### Step 2: Check Contract Deployment

1. Verify the contract address exists:
```
cat contract-address.json
```

2. If not deployed or deployment failed, deploy again:
```
npx hardhat run scripts/deploy-to-ganache-fixed.js --network ganache
```

### Step 3: Use the Enhanced Connection Tester

1. Start the server if not already running:
```
node server.js
```

2. Open the enhanced connection tester in your browser:
```
http://localhost:3000/enhanced-tester.html
```

3. Follow the interactive tests to pinpoint the issue

### Step 4: Test Directly with API Endpoints

Try accessing the API test endpoint:
```
http://localhost:3000/api/test-connection
```

You should see a JSON response: `{"success":true,"message":"API server is responding correctly"}`

### Step 5: Check Contract Validity

Use the contract check endpoint:
```
http://localhost:3000/api/check-contract?address=0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
```

## Advanced Troubleshooting

### JavaScript Console Debugging

Open your browser's developer tools (F12) and run these commands in the console:

1. Check if ethers is loaded:
```javascript
console.log(typeof ethers);  // Should output "object"
```

2. Test connection to Ganache:
```javascript
async function testConnection() {
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:7545');
    const blockNumber = await provider.getBlockNumber();
    console.log('Connected! Block number:', blockNumber);
  } catch (error) {
    console.error('Connection error:', error);
  }
}
testConnection();
```

### Network Configuration

If you're using a different network setup:

1. Update the connection URL in app.js:
```javascript
const provider = new ethers.JsonRpcProvider('http://YOUR_HOST:YOUR_PORT');
```

2. Update the server's CORS settings if needed:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'YOUR_FRONTEND_ORIGIN');
  // ...rest of CORS settings
});
```

## If All Else Fails

Try this complete reset procedure:

1. Stop all running processes (Ganache, server)
2. Clear browser cache or use incognito mode
3. Restart your machine to ensure no lingering processes
4. Start Ganache with explicit host binding:
```
ganache --port 7545 --host 0.0.0.0 --deterministic
```
5. Deploy the contract again
6. Start the server
7. Use the enhanced connection tester to verify each component

## Still Having Issues?

Contact the development team with:
1. Screenshots of any error messages
2. Output from the connection tester
3. Browser console logs
4. Terminal output from Ganache and server
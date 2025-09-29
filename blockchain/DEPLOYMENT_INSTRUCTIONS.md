# Simplified Deployment Instructions

## How to Run Your Setup Without Scripts

Now that you have a persistent Ganache workspace saved, you only need to follow these steps:

### 1. Start Ganache

- Open the Ganache GUI application
- Select your saved workspace

### 2. Start the Web Server

```bash
cd blockchain
node server.js
```

### 3. Access the Web Interface

- Open `http://localhost:3000` in your browser
- Use the `account-setup.html` or `index.html` pages

### 4. Deploy a New Contract (Only If Needed)

```bash
cd blockchain
node scripts/deploy-simple.js
```

This simplified approach works well now that you have everything set up correctly with a persistent workspace.
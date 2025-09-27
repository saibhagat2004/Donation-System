# Smart Contract Testing Commands

This file contains all commands needed to test the Donation smart contract in various ways.

## Basic Testing Commands

```bash
# Run all tests
npx hardhat test

# Run tests with console output for debugging
npx hardhat test --verbose

# Run tests and show gas usage
npx hardhat test --gas
```

## Testing Specific Sections

```bash
# Test contract setup only
npx hardhat test --grep "Contract Setup"

# Test incoming donations only
npx hardhat test --grep "Incoming Donations"

# Test outgoing transactions only
npx hardhat test --grep "Outgoing Transactions"

# Test data fetching only
npx hardhat test --grep "Data Fetching"

# Test initial balance recording only
npx hardhat test --grep "Initial Balance Recording"
```

## Testing Specific Test Cases

```bash
# Test NGO balance update after donation
npx hardhat test --grep "should update NGO balance after donation"

# Test spending validation
npx hardhat test --grep "should fail when spending more than available"

# Test initial balance recording
npx hardhat test --grep "should record initial balance for a new NGO"
```

## Testing with Coverage Report

First, install the coverage plugin if not already installed:

```bash
npm install --save-dev solidity-coverage
```

Add it to your hardhat.config.js:

```javascript
require("solidity-coverage");
```

Then run:

```bash
npx hardhat coverage
```

This will generate a detailed coverage report showing which parts of your contract have been tested.

## Testing with Gas Usage Report

Install gas reporter if not already installed:

```bash
npm install --save-dev hardhat-gas-reporter
```

Add it to your hardhat.config.js:

```javascript
require("hardhat-gas-reporter");
```

Configure it in your hardhat.config.js:

```javascript
gasReporter: {
  enabled: true,
  currency: 'INR',
  outputFile: 'gas-report.txt',
  noColors: true,
}
```

Then run tests normally:

```bash
npx hardhat test
```

The gas usage report will be generated automatically.

## Running Tests on Different Networks

```bash
# Run on hardhat network (default)
npx hardhat test

# Run on local node
npx hardhat test --network localhost

# Run on Ganache
npx hardhat test --network ganache
```

## Deployment and Testing Workflow

```bash
# Start a local node
npx hardhat node

# Deploy contract to local node (in a separate terminal)
npx hardhat run scripts/deploy.js --network localhost

# Run tests against the local deployment
npx hardhat test --network localhost
```

## Hardhat Console for Interactive Testing

```bash
# Start interactive console
npx hardhat console --network localhost

# In the console, you can test contract functions directly:
> const Donation = await ethers.getContractFactory("Donation")
> const donation = await Donation.attach("DEPLOYED_CONTRACT_ADDRESS")
> await donation.getNgoBalance("49499107")
```

## Debugging Tests

```bash
# Run tests with debugging enabled
NODE_DEBUG=hardhat* npx hardhat test

# Run a specific test in debug mode
NODE_DEBUG=hardhat* npx hardhat test --grep "specific test name"
```

## Handling BigInt Values in Tests

When testing contracts with Hardhat/ethers.js, numeric values returned from contract calls are BigInt objects. There are specific requirements when working with these in JavaScript:

```javascript
// Wrong: Can't directly compare BigInt with number
expect(bigIntValue).to.equal(5000); // This will fail

// Correct approaches:
// 1. Convert BigInt to string
expect(bigIntValue.toString()).to.equal('5000');

// 2. Convert both to same type (BigInt)
expect(bigIntValue).to.equal(BigInt(5000));

// 3. For array elements that are BigInt
expect(arrayWithBigInt[3].toString()).to.equal('5000');

// 4. For arithmetic operations
const donationCount = await contract.getCount();
const lastIndex = Number(donationCount.toString()) - 1;
```

Note that comparing BigInt values with regular numbers will throw a TypeError: "Cannot mix BigInt and other types, use explicit conversions".

## Test Reporting

```bash
# Export test results to JUnit format (useful for CI/CD)
npx hardhat test --reporter junit --reporter-options outputFile=test-results.xml
```

## Clean Build and Test

```bash
# Clean artifacts and cache before testing
npx hardhat clean
npx hardhat test
```

Feel free to add more commands as needed for your specific testing requirements.
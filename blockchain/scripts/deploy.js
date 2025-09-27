const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Donation contract...");
  
  // Get the first signer (account) from the connected provider
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  
  // Check account balance
  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();

  console.log("Donation deployed to:", donation.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
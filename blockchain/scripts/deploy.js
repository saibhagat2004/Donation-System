const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Donation contract...");

  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();
  await donation.deployed();

  console.log("Donation deployed to:", donation.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
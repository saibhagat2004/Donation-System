const { expect } = require("chai");
const hre = require("hardhat");

describe("Donation Contract", function () {
  let donationContract;
  let owner;
  let donor;

  beforeEach(async function () {
    const [ownerSigner, donorSigner] = await hre.ethers.getSigners();
    owner = ownerSigner;
    donor = donorSigner;

    const Donation = await hre.ethers.getContractFactory("Donation");
    donationContract = await Donation.deploy();
  });

  it("Should set the right owner", async function () {
    expect(await donationContract.owner()).to.equal(owner.address);
  });

  it("Should accept donations", async function () {
    const donationAmount = hre.ethers.parseEther("1.0");
    
    await donationContract.connect(donor).donate({ value: donationAmount });
    
    expect(await donationContract.getDonationAmount(donor.address)).to.equal(donationAmount);
    expect(await donationContract.totalDonations()).to.equal(donationAmount);
  });
});
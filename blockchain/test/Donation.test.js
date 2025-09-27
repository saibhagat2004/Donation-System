const { expect } = require("chai");
const { ethers } = require("hardhat");
require("chai-ethers");

// Configure Chai to handle BigInt correctly
const chai = require("chai");

describe("Donation Contract", function () {
  let donationContract;
  let owner;
  let user1;
  let user2;
  
  // Test data
  const testNgoId = "49499107";
  const testDonorId = "42188923";
  const testCause = "Education";
  const testAmount = 5000; // 5000 rupees
  const testTimestamp = Math.floor(Date.now() / 1000);
  
  beforeEach(async function () {
    // Deploy a fresh contract before each test
    const [ownerSigner, user1Signer, user2Signer] = await ethers.getSigners();
    owner = ownerSigner;
    user1 = user1Signer;
    user2 = user2Signer;
    
    const Donation = await ethers.getContractFactory("Donation");
    donationContract = await Donation.deploy();
    await donationContract.waitForDeployment();
  });

  describe("Contract Setup", function() {
    it("Should set the right owner", async function () {
      expect(await donationContract.owner()).to.equal(owner.address);
    });
  });
  
  describe("Incoming Donations", function() {
    it("should record a donation correctly", async function() {
      // Record donation
      const tx = await donationContract.recordDonation(
        testNgoId,
        testDonorId,
        testCause,
        testAmount,
        testTimestamp
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Check for DonationReceived event
      const donationEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "DonationReceived"
      );
      expect(donationEvent).to.not.be.undefined;
      
      // Get donation count
      const count = await donationContract.getIncomingDonationsCount();
      expect(count.toString()).to.equal('1');
      
      // Get donation details and verify
      const donation = await donationContract.getIncomingDonation(0);
      expect(donation[1]).to.equal(testNgoId); // ngoId
      expect(donation[2]).to.equal(testDonorId); // donorId
      expect(donation[3]).to.equal(testCause); // cause
      expect(donation[4].toString()).to.equal(testAmount.toString()); // amount
      expect(donation[5].toString()).to.equal(testTimestamp.toString()); // timestamp
    });
    
    it("should update NGO balance after donation", async function() {
      // Record donation
      await donationContract.recordDonation(
        testNgoId,
        testDonorId,
        testCause,
        testAmount,
        testTimestamp
      );
      
      // Check NGO balance
      const balance = await donationContract.getNgoBalance(testNgoId);
      expect(balance.toString()).to.equal(testAmount.toString());
    });
    
    it("should track total donations correctly", async function() {
      // Record first donation
      await donationContract.recordDonation(
        testNgoId,
        testDonorId,
        testCause,
        testAmount,
        testTimestamp
      );
      
      // Record second donation
      await donationContract.recordDonation(
        testNgoId,
        "DONOR_456",
        "Healthcare",
        3000,
        testTimestamp + 100
      );
      
      // Check total donations
      const totalDonations = await donationContract.totalDonations();
      expect(totalDonations.toString()).to.equal('8000'); // 5000 + 3000
    });
    
    it("should fail when recording donation with empty NGO ID", async function() {
      try {
        await donationContract.recordDonation(
          "", // Empty NGO ID
          testDonorId,
          testCause,
          testAmount,
          testTimestamp
        );
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("NGO ID cannot be empty");
      }
    });
    
    it("should fail when recording donation with zero amount", async function() {
      try {
        await donationContract.recordDonation(
          testNgoId,
          testDonorId,
          testCause,
          0, // Zero amount
          testTimestamp
        );
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("Amount must be greater than 0");
      }
    });
  });
  
  describe("Outgoing Transactions", function() {
    beforeEach(async function() {
      // Add funds before testing spending
      await donationContract.recordDonation(
        testNgoId,
        testDonorId,
        testCause,
        10000, // 10000 rupees
        testTimestamp
      );
    });
    
    it("should record spending correctly", async function() {
      // Record spending
      const spendingTx = await donationContract.connect(owner).recordSpending(
        testNgoId,
        "VENDOR_789",
        "School Supplies",
        3000, // 3000 rupees
        testTimestamp + 200,
        ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_123")) // Mock verification hash
      );
      
      const receipt = await spendingTx.wait();
      
      // Check for FundsSpent event
      const spendEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "FundsSpent"
      );
      expect(spendEvent).to.not.be.undefined;
      
      // Get spending count
      const outgoingCount = await donationContract.getOutgoingTransactionsCount();
      expect(outgoingCount.toString()).to.equal('1');
      
      // Get spending details and verify
      const spending = await donationContract.getOutgoingTransaction(0);
      expect(spending[1]).to.equal(testNgoId); // ngoId
      expect(spending[2]).to.equal("VENDOR_789"); // receiverId
      expect(spending[3]).to.equal("School Supplies"); // cause
      expect(spending[4].toString()).to.equal('3000'); // amount
      expect(spending[5].toString()).to.equal((testTimestamp + 200).toString()); // timestamp
    });
    
    it("should update NGO balance after spending", async function() {
      // Record spending
      await donationContract.connect(owner).recordSpending(
        testNgoId,
        "VENDOR_789",
        "School Supplies",
        3000, // 3000 rupees
        testTimestamp + 200,
        ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_123"))
      );
      
      // Check NGO balance (10000 - 3000 = 7000)
      const balance = await donationContract.getNgoBalance(testNgoId);
      expect(balance.toString()).to.equal('7000');
    });
    
    it("should fail when spending more than available balance", async function() {
      try {
        await donationContract.connect(owner).recordSpending(
          testNgoId,
          "VENDOR_789",
          "School Supplies",
          15000, // More than the 10000 available
          testTimestamp + 200,
          ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_123"))
        );
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("Insufficient NGO balance");
      }
    });
    
    it("should fail when non-owner tries to record spending", async function() {
      try {
        await donationContract.connect(user1).recordSpending( // Using user1 instead of owner
          testNgoId,
          "VENDOR_789",
          "School Supplies",
          3000,
          testTimestamp + 200,
          ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_123"))
        );
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("Only owner can call this function");
      }
    });
  });
  
  describe("Data Fetching", function() {
    beforeEach(async function() {
      // Add test data
      // First NGO
      await donationContract.recordDonation(
        testNgoId,
        testDonorId,
        "Education",
        5000,
        testTimestamp
      );
      
      await donationContract.recordDonation(
        testNgoId,
        "DONOR_456",
        "Education",
        3000,
        testTimestamp + 100
      );
      
      await donationContract.connect(owner).recordSpending(
        testNgoId,
        "VENDOR_789",
        "School Supplies",
        2000,
        testTimestamp + 200,
        ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_123"))
      );
      
      // Second NGO
      await donationContract.recordDonation(
        "NGO_567",
        "DONOR_321",
        "Healthcare",
        4000,
        testTimestamp + 300
      );
      
      await donationContract.connect(owner).recordSpending(
        "NGO_567",
        "HOSPITAL_123",
        "Medical Camp",
        1500,
        testTimestamp + 400,
        ethers.keccak256(ethers.toUtf8Bytes("receipt_hash_456"))
      );
    });
    
    it("should fetch NGO summary correctly", async function() {
      const summary = await donationContract.getNgoSummary(testNgoId);
      
      expect(summary[0].toString()).to.equal('8000'); // totalReceived
      expect(summary[1].toString()).to.equal('2000'); // totalSpent
      expect(summary[2].toString()).to.equal('2'); // incomingCount
      expect(summary[3].toString()).to.equal('1'); // outgoingCount
      expect(summary[4].toString()).to.equal('6000'); // currentBalance
    });
    
    it("should fetch specific NGO's incoming transactions", async function() {
      // Check count
      const incomingCount = await donationContract.getNgoIncomingTransactionCount(testNgoId);
      expect(incomingCount.toString()).to.equal('2');
      
      // Get first donation for this NGO
      const donation = await donationContract.getNgoIncomingTransaction(testNgoId, 0);
      expect(donation[1]).to.equal(testDonorId); // donorId
      expect(donation[2]).to.equal("Education"); // cause
      expect(donation[3].toString()).to.equal('5000'); // amount
    });
    
    it("should fetch specific NGO's outgoing transactions", async function() {
      // Check count
      const outgoingCount = await donationContract.getNgoOutgoingTransactionCount(testNgoId);
      expect(outgoingCount.toString()).to.equal('1');
      
      // Get first spending for this NGO
      const spending = await donationContract.getNgoOutgoingTransaction(testNgoId, 0);
      expect(spending[1]).to.equal("VENDOR_789"); // receiverId
      expect(spending[2]).to.equal("School Supplies"); // cause
      expect(spending[3].toString()).to.equal('2000'); // amount
    });
    
    it("should fetch all active NGO IDs", async function() {
      const activeNgos = await donationContract.getActiveNgoIds(10);
      
      expect(activeNgos.length).to.equal(2);
      expect(activeNgos[0]).to.equal(testNgoId);
      expect(activeNgos[1]).to.equal("NGO_567");
    });
  });
  
  describe("Initial Balance Recording", function() {
    it("should record initial balance for a new NGO", async function() {
      const initialBalance = 50000; // 50,000 rupees
      
      // Record initial balance
      const tx = await donationContract.connect(owner).recordInitialBalance(
        "NEW_NGO_123",
        initialBalance,
        0 // Use current timestamp
      );
      
      const receipt = await tx.wait();
      
      // Check events
      const balanceEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === "NgoBalanceUpdated"
      );
      expect(balanceEvent).to.not.be.undefined;
      
      // Check NGO balance
      const balance = await donationContract.getNgoBalance("NEW_NGO_123");
      expect(balance.toString()).to.equal(initialBalance.toString());
      
      // Check it's recorded as a special donation
      const donationCount = await donationContract.getIncomingDonationsCount();
      const lastIndex = Number(donationCount.toString()) - 1;
      const donation = await donationContract.getIncomingDonation(lastIndex);
      expect(donation[2]).to.equal("INITIAL_BALANCE"); // donorId
    });
    
    it("should fail when recording initial balance with zero amount", async function() {
      try {
        await donationContract.connect(owner).recordInitialBalance(
          "NEW_NGO_123",
          0, // Zero amount
          testTimestamp
        );
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("Initial balance must be greater than 0");
      }
    });
  });
});
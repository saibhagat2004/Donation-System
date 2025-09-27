// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Donation Smart Contract
 * @dev A contract for tracking donations to NGOs and their subsequent spending
 * with full transparency and accountability
 */
contract Donation {
    // Contract owner address who can manage the contract
    address public owner;
    
    // Running total of all donations received across all NGOs
    uint256 public totalDonations;
    
    // Auto-incrementing ID for transactions
    uint256 private nextTransactionId = 1;
    
    /**
     * @dev Structure to store incoming donation details
     * @param transactionId Unique identifier for this transaction
     * @param ngoId Identifier for the NGO receiving the donation
     * @param donorId Identifier for the donor (can be anonymous)
     * @param cause The purpose or campaign for this donation
     * @param amount The amount donated
     * @param timestamp When the donation was made
     * @param sender The address that recorded this donation
     */
    struct IncomingDonation {
        uint256 transactionId;
        string ngoId;
        string donorId;
        string cause;
        uint256 amount;
        uint256 timestamp;
        address sender;
    }
    
    /**
     * @dev Structure to store outgoing spending details
     * @param transactionId Unique identifier for this transaction
     * @param ngoId Identifier for the NGO spending the funds
     * @param receiverId Identifier for who received the funds (vendor, beneficiary)
     * @param cause The purpose of this spending
     * @param amount The amount spent
     * @param timestamp When the spending occurred
     * @param verificationHash Hash of receipts or verification documents
     * @param executor The address that recorded this spending
     */
    struct OutgoingTransaction {
        uint256 transactionId;
        string ngoId;
        string receiverId;
        string cause;
        uint256 amount;
        uint256 timestamp;
        bytes32 verificationHash; // Optional hash of verification documents
        address executor;
    }
    
    // Arrays to store all transactions (complete history)
    IncomingDonation[] public incomingDonations;
    OutgoingTransaction[] public outgoingTransactions;
    
    // Mappings for NGO-specific lookups
    mapping(string => uint256[]) private ngoIncomingTransactions;
    mapping(string => uint256[]) private ngoOutgoingTransactions;
    
    // Track each NGO's current balance (received - spent)
    mapping(string => uint256) public ngoBalances;
    
    // Events to notify listeners of transactions
    /**
     * @dev Emitted when a donation is received
     */
    event DonationReceived(
        uint256 indexed transactionId,
        string ngoId,
        string donorId,
        string cause,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when NGO funds are spent
     */
    event FundsSpent(
        uint256 indexed transactionId,
        string ngoId,
        string receiverId,
        string cause,
        uint256 amount,
        uint256 timestamp,
        bytes32 verificationHash
    );
    
    /**
     * @dev Emitted when an NGO balance changes
     */
    event NgoBalanceUpdated(
        string ngoId,
        uint256 newBalance,
        string action
    );
    
    /**
     * @dev Sets contract deployer as owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Restricts function to contract owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Records a new donation received by an NGO
     * @param ngoId Identifier for the NGO receiving the donation
     * @param donorId Identifier for the donor
     * @param cause Purpose of the donation
     * @param amount Amount donated
     * @param timestamp When donation occurred (0 for current block time)
     * @return Unique transaction ID assigned to this donation
     */
    function recordDonation(
        string memory ngoId,
        string memory donorId,
        string memory cause,
        uint256 amount,
        uint256 timestamp
    ) public returns (uint256) {
        require(bytes(ngoId).length > 0, "NGO ID cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        
        // Generate new transaction ID
        uint256 transactionId = nextTransactionId++;
        
        // Create donation record
        IncomingDonation memory newDonation = IncomingDonation({
            transactionId: transactionId,
            ngoId: ngoId,
            donorId: donorId,
            cause: cause,
            amount: amount,
            timestamp: timestamp == 0 ? block.timestamp : timestamp,
            sender: msg.sender
        });
        
        // Store donation in main history
        incomingDonations.push(newDonation);
        
        // Store donation index in NGO-specific lookup
        ngoIncomingTransactions[ngoId].push(incomingDonations.length - 1);
        
        // Update totals
        totalDonations += amount;
        
        // Update NGO balance
        ngoBalances[ngoId] += amount;
        
        // Emit events
        emit DonationReceived(
            transactionId,
            ngoId,
            donorId,
            cause,
            amount,
            newDonation.timestamp
        );
        
        emit NgoBalanceUpdated(
            ngoId,
            ngoBalances[ngoId],
            "donation"
        );
        
        return transactionId;
    }
    
    /**
     * @dev Records funds spent by an NGO
     * @param ngoId Identifier for the NGO spending the funds
     * @param receiverId Who received the funds (vendor, beneficiary)
     * @param cause Purpose of the spending
     * @param amount Amount spent
     * @param timestamp When spending occurred (0 for current block time)
     * @param verificationHash Hash of verification documents (optional)
     * @return Unique transaction ID assigned to this spending
     */
    function recordSpending(
        string memory ngoId,
        string memory receiverId,
        string memory cause,
        uint256 amount,
        uint256 timestamp,
        bytes32 verificationHash
    ) public onlyOwner returns (uint256) {
        require(bytes(ngoId).length > 0, "NGO ID cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check NGO has sufficient balance
        require(ngoBalances[ngoId] >= amount, "Insufficient NGO balance");
        
        // Generate new transaction ID
        uint256 transactionId = nextTransactionId++;
        
        // Create spending record
        OutgoingTransaction memory newSpending = OutgoingTransaction({
            transactionId: transactionId,
            ngoId: ngoId,
            receiverId: receiverId,
            cause: cause,
            amount: amount,
            timestamp: timestamp == 0 ? block.timestamp : timestamp,
            verificationHash: verificationHash,
            executor: msg.sender
        });
        
        // Store spending in main history
        outgoingTransactions.push(newSpending);
        
        // Store spending index in NGO-specific lookup
        ngoOutgoingTransactions[ngoId].push(outgoingTransactions.length - 1);
        
        // Update NGO balance
        ngoBalances[ngoId] -= amount;
        
        // Emit events
        emit FundsSpent(
            transactionId,
            ngoId,
            receiverId,
            cause,
            amount,
            newSpending.timestamp,
            verificationHash
        );
        
        emit NgoBalanceUpdated(
            ngoId,
            ngoBalances[ngoId],
            "spending"
        );
        
        return transactionId;
    }
    
    /**
     * @dev Returns the total count of all donations
     * @return Total number of donations recorded
     */
    function getIncomingDonationsCount() public view returns (uint256) {
        return incomingDonations.length;
    }
    
    /**
     * @dev Returns the total count of all spending transactions
     * @return Total number of spending transactions recorded
     */
    function getOutgoingTransactionsCount() public view returns (uint256) {
        return outgoingTransactions.length;
    }
    
    /**
     * @dev Get the current balance of a specific NGO
     * @param ngoId The NGO identifier
     * @return Current balance (donations minus spending)
     */
    function getNgoBalance(string memory ngoId) public view returns (uint256) {
        return ngoBalances[ngoId];
    }
    
    // Get a specific incoming donation by index
    function getIncomingDonation(uint256 index) public view returns (
        uint256 transactionId,
        string memory ngoId,
        string memory donorId,
        string memory cause,
        uint256 amount,
        uint256 timestamp
    ) {
        require(index < incomingDonations.length, "Index out of bounds");
        
        IncomingDonation memory donation = incomingDonations[index];
        return (
            donation.transactionId,
            donation.ngoId,
            donation.donorId,
            donation.cause,
            donation.amount,
            donation.timestamp
        );
    }
    
    // Get a specific outgoing transaction by index
    function getOutgoingTransaction(uint256 index) public view returns (
        uint256 transactionId,
        string memory ngoId,
        string memory receiverId,
        string memory cause,
        uint256 amount,
        uint256 timestamp,
        bytes32 verificationHash
    ) {
        require(index < outgoingTransactions.length, "Index out of bounds");
        
        OutgoingTransaction memory transaction = outgoingTransactions[index];
        return (
            transaction.transactionId,
            transaction.ngoId,
            transaction.receiverId,
            transaction.cause,
            transaction.amount,
            transaction.timestamp,
            transaction.verificationHash
        );
    }
    
    // Get all transaction IDs for a specific NGO
    function getNgoIncomingTransactionCount(string memory ngoId) public view returns (uint256) {
        return ngoIncomingTransactions[ngoId].length;
    }
    
    function getNgoOutgoingTransactionCount(string memory ngoId) public view returns (uint256) {
        return ngoOutgoingTransactions[ngoId].length;
    }
    
    // Get a specific NGO's incoming donation by index
    function getNgoIncomingTransaction(string memory ngoId, uint256 index) public view returns (
        uint256 transactionId,
        string memory donorId,
        string memory cause,
        uint256 amount,
        uint256 timestamp
    ) {
        require(index < ngoIncomingTransactions[ngoId].length, "Index out of bounds");
        
        uint256 donationIndex = ngoIncomingTransactions[ngoId][index];
        IncomingDonation memory donation = incomingDonations[donationIndex];
        
        return (
            donation.transactionId,
            donation.donorId,
            donation.cause,
            donation.amount,
            donation.timestamp
        );
    }
    
    // Get a specific NGO's outgoing transaction by index
    function getNgoOutgoingTransaction(string memory ngoId, uint256 index) public view returns (
        uint256 transactionId,
        string memory receiverId,
        string memory cause,
        uint256 amount,
        uint256 timestamp,
        bytes32 verificationHash
    ) {
        require(index < ngoOutgoingTransactions[ngoId].length, "Index out of bounds");
        
        uint256 txIndex = ngoOutgoingTransactions[ngoId][index];
        OutgoingTransaction memory transaction = outgoingTransactions[txIndex];
        
        return (
            transaction.transactionId,
            transaction.receiverId,
            transaction.cause,
            transaction.amount,
            transaction.timestamp,
            transaction.verificationHash
        );
    }
    
    /**
     * @dev Get a comprehensive financial summary for an NGO
     * @param ngoId The NGO identifier
     * @return totalReceived Total funds received by this NGO
     * @return totalSpent Total funds spent by this NGO
     * @return incomingCount Number of donation transactions
     * @return outgoingCount Number of spending transactions
     * @return currentBalance Current balance (should match ngoBalances[ngoId])
     */
    function getNgoSummary(string memory ngoId) public view returns (
        uint256 totalReceived,
        uint256 totalSpent,
        uint256 incomingCount,
        uint256 outgoingCount,
        uint256 currentBalance
    ) {
        uint256 received = 0;
        uint256 spent = 0;
        
        // Sum all incoming donations
        for (uint i = 0; i < ngoIncomingTransactions[ngoId].length; i++) {
            received += incomingDonations[ngoIncomingTransactions[ngoId][i]].amount;
        }
        
        // Sum all outgoing transactions
        for (uint i = 0; i < ngoOutgoingTransactions[ngoId].length; i++) {
            spent += outgoingTransactions[ngoOutgoingTransactions[ngoId][i]].amount;
        }
        
        // Return comprehensive summary
        return (
            received,
            spent,
            ngoIncomingTransactions[ngoId].length,
            ngoOutgoingTransactions[ngoId].length,
            ngoBalances[ngoId]
        );
    }
    
    /**
     * @dev Get a list of NGOs that have received donations
     * This is a helper function for admin interfaces
     * Note: This is an approximation as it only checks the first N transactions
     * @param limit Maximum number of donations to check
     * @return ngoIds Array of NGO identifiers found in the system
     */
    function getActiveNgoIds(uint256 limit) public view returns (string[] memory) {
        // Create a temporary array to store NGO IDs (may contain duplicates)
        string[] memory tempNgoIds = new string[](limit);
        uint256 ngoCount = 0;
        
        // Check incoming donations up to the limit
        uint256 donationsToCheck = limit < incomingDonations.length ? limit : incomingDonations.length;
        
        // Find NGOs
        for (uint256 i = 0; i < donationsToCheck; i++) {
            string memory currentNgoId = incomingDonations[i].ngoId;
            bool isDuplicate = false;
            
            // Check if this NGO ID is already in our result array
            for (uint256 j = 0; j < ngoCount; j++) {
                // Compare strings using keccak256 hash
                if (keccak256(bytes(tempNgoIds[j])) == keccak256(bytes(currentNgoId))) {
                    isDuplicate = true;
                    break;
                }
            }
            
            // If it's not a duplicate, add it to our results
            if (!isDuplicate && ngoCount < limit) {
                tempNgoIds[ngoCount] = currentNgoId;
                ngoCount++;
            }
        }
        
        // Create properly sized result array
        string[] memory result = new string[](ngoCount);
        for (uint256 i = 0; i < ngoCount; i++) {
            result[i] = tempNgoIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Records initial bank balance for an NGO that existed before blockchain integration
     * @param ngoId Identifier for the NGO
     * @param initialBalance The pre-existing balance from bank records
     * @param recordDate Timestamp when this initial record was created (0 for current time)
     * @return Unique transaction ID assigned to this initial balance record
     */
    function recordInitialBalance(
        string memory ngoId,
        uint256 initialBalance,
        uint256 recordDate
    ) public onlyOwner returns (uint256) {
        require(bytes(ngoId).length > 0, "NGO ID cannot be empty");
        require(initialBalance > 0, "Initial balance must be greater than 0");
        
        // Optional: Check if NGO already has transactions
        if (ngoIncomingTransactions[ngoId].length > 0) {
            // If you want to strictly enforce this, uncomment the line below
            // require(ngoIncomingTransactions[ngoId].length == 0, "NGO already has transactions");
            
            // Instead of failing, we'll emit a warning event but allow the operation
            emit NgoBalanceUpdated(
                ngoId,
                ngoBalances[ngoId],
                "warning_overriding_existing_balance"
            );
        }
        
        // Record this as a special donation with "INITIAL_BALANCE" as donor ID
        uint256 transactionId = recordDonation(
            ngoId,
            "INITIAL_BALANCE", 
            "Initial bank balance before blockchain integration",
            initialBalance,
            recordDate == 0 ? block.timestamp : recordDate
        );
        
        // Emit a specific event for initial balance recording
        emit NgoBalanceUpdated(
            ngoId,
            ngoBalances[ngoId],
            "initial_balance"
        );
        
        return transactionId;
    }
}
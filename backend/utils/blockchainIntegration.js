// /**
//  * Blockchain integration utility for recording spending transactions
//  * This is a placeholder that can be replaced with actual blockchain calls
//  */

// import { ethers } from 'ethers';
// import { BLOCKCHAIN_CONFIG, CONTRACT_ABI } from '../config/blockchain.config.js';

// class BlockchainIntegration {
//   constructor() {
//     this.isInitialized = false;
//     this.provider = null;
//     this.signer = null;
//     this.contract = null;
//     this.connectionAttempts = 0;
//   }

//   async initialize() {
//     try {
//       console.log('🔗 Initializing blockchain connection...');
//       console.log(`   RPC URL: ${BLOCKCHAIN_CONFIG.RPC_URL}`);
//       console.log(`   Contract: ${BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS}`);
      
//       // Create provider
//       this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL, {
//         chainId: 1337,
//         name: 'Ganache'
//       });
      
//       // Test connection
//       const blockNumber = await this.provider.getBlockNumber();
//       console.log(`   Connected! Current block: ${blockNumber}`);
      
//       // Create signer from private key
//       this.signer = new ethers.Wallet(BLOCKCHAIN_CONFIG.PRIVATE_KEY, this.provider);
//       const signerAddress = await this.signer.getAddress();
//       console.log(`   Signer address: ${signerAddress}`);
      
//       // Create contract instance
//       this.contract = new ethers.Contract(
//         BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
//         CONTRACT_ABI,
//         this.signer
//       );
      
//       // Verify contract is accessible
//       const owner = await this.contract.owner();
//       console.log(`   Contract owner: ${owner}`);
      
//       if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
//         console.warn('⚠️ Warning: Signer is not contract owner. recordSpending will fail!');
//         console.warn(`   Expected: ${owner}`);
//         console.warn(`   Got: ${signerAddress}`);
//       }
      
//       this.isInitialized = true;
//       this.connectionAttempts = 0;
//       return true;
      
//     } catch (error) {
//       console.error('❌ Failed to initialize blockchain:', error.message);
//       this.isInitialized = false;
//       this.connectionAttempts++;
      
//       // If too many failures, throw error
//       if (this.connectionAttempts >= 3) {
//         throw new Error(`Blockchain connection failed after ${this.connectionAttempts} attempts: ${error.message}`);
//       }
      
//       return false;
//     }
//   }

//   async recordSpending({ ngo_account, receiver_id, cause, amount, verification_hash }) {
//     try {
//       // Ensure we're connected
//       if (!this.isInitialized) {
//         const initialized = await this.initialize();
//         if (!initialized) {
//           throw new Error('Failed to initialize blockchain connection');
//         }
//       }

//       console.log(`🔗 Recording spending on blockchain:`);
//       console.log(`   NGO Account: ${ngo_account}`);
//       console.log(`   Receiver: ${receiver_id}`);
//       console.log(`   Cause: ${cause}`);
//       console.log(`   Amount: ₹${amount}`);
//       console.log(`   Verification Hash: ${verification_hash}`);

//       // Convert verification hash to bytes32 format
//       let hashBytes32;
//       if (!verification_hash || verification_hash === '0x0') {
//         // Use zero bytes32 for missing documents
//         hashBytes32 = ethers.ZeroHash;
//       } else {
//         // Ensure hash is proper bytes32 format
//         hashBytes32 = verification_hash.startsWith('0x') ? verification_hash : `0x${verification_hash}`;
//         // Pad to 32 bytes if needed
//         if (hashBytes32.length < 66) {
//           hashBytes32 = ethers.zeroPadValue(hashBytes32, 32);
//         }
//       }

//       // Record spending on blockchain
//       // Note: The contract expects (ngoId, receiverId, cause, amount, timestamp, verificationHash)
//       const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
      
//       console.log(`📤 Sending transaction to blockchain...`);
//       const tx = await this.contract.recordSpending(
//         ngo_account,
//         receiver_id,
//         cause,
//         amount,
//         timestamp,
//         hashBytes32,
//         {
//           gasLimit: BLOCKCHAIN_CONFIG.GAS_LIMIT
//         }
//       );
      
//       console.log(`⏳ Transaction sent: ${tx.hash}`);
//       console.log(`   Waiting for confirmation...`);
      
//       // Wait for transaction to be mined
//       const receipt = await tx.wait();
      
//       console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
//       console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
//       return {
//         success: true,
//         tx_id: tx.hash,
//         blockchain_tx_id: tx.hash,
//         block_number: receipt.blockNumber,
//         gas_used: receipt.gasUsed.toString(),
//         verification_hash: hashBytes32,
//         timestamp: timestamp
//       };

//     } catch (error) {
//       console.error('❌ Blockchain recording failed:', error);
      
//       // Check if it's a connection error
//       if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
//         console.log('🔄 Connection lost, resetting initialization...');
//         this.isInitialized = false;
//       }
      
//       return {
//         success: false,
//         error: error.message,
//         reason: error.reason || 'Unknown error'
//       };
//     }
//   }

//   async recordDonation({ ngo_account, donor_id, cause, amount }) {
//     try {
//       if (!this.isInitialized) {
//         const initialized = await this.initialize();
//         if (!initialized) {
//           throw new Error('Failed to initialize blockchain connection');
//         }
//       }

//       console.log(`🔗 Recording donation on blockchain:`);
//       console.log(`   NGO Account: ${ngo_account}`);
//       console.log(`   Donor: ${donor_id}`);
//       console.log(`   Cause: ${cause}`);
//       console.log(`   Amount: ₹${amount}`);

//       const timestamp = Math.floor(Date.now() / 1000);
      
//       const tx = await this.contract.recordDonation(
//         ngo_account,
//         donor_id,
//         cause,
//         amount,
//         timestamp,
//         {
//           gasLimit: BLOCKCHAIN_CONFIG.GAS_LIMIT
//         }
//       );
      
//       console.log(`⏳ Transaction sent: ${tx.hash}`);
//       const receipt = await tx.wait();
      
//       console.log(`✅ Donation recorded in block ${receipt.blockNumber}`);
      
//       return {
//         success: true,
//         tx_id: tx.hash,
//         blockchain_tx_id: tx.hash,
//         block_number: receipt.blockNumber,
//         gas_used: receipt.gasUsed.toString(),
//         timestamp: timestamp
//       };

//     } catch (error) {
//       console.error('❌ Failed to record donation:', error);
      
//       if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
//         this.isInitialized = false;
//       }
      
//       return {
//         success: false,
//         error: error.message,
//         reason: error.reason || 'Unknown error'
//       };
//     }
//   }

//   async getTransactionStatus(txId) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       console.log(`🔍 Checking blockchain transaction status: ${txId}`);
      
//       const receipt = await this.provider.getTransactionReceipt(txId);
      
//       if (!receipt) {
//         return {
//           success: true,
//           status: 'pending',
//           confirmations: 0
//         };
//       }
      
//       const currentBlock = await this.provider.getBlockNumber();
//       const confirmations = currentBlock - receipt.blockNumber;
      
//       return {
//         success: true,
//         status: receipt.status === 1 ? 'confirmed' : 'failed',
//         confirmations: confirmations,
//         block_number: receipt.blockNumber,
//         gas_used: receipt.gasUsed.toString()
//       };

//     } catch (error) {
//       console.error('❌ Failed to check transaction status:', error);
//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   }

//   async getNgoBalance(ngoAccount) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       console.log(`💰 Getting NGO balance for account: ${ngoAccount}`);
      
//       const balance = await this.contract.getNgoBalance(ngoAccount);
      
//       console.log(`   Balance: ₹${balance.toString()}`);
      
//       return {
//         success: true,
//         balance: balance.toString(),
//         account: ngoAccount
//       };

//     } catch (error) {
//       console.error('❌ Failed to get NGO balance:', error);
//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   }

//   /**
//    * Test blockchain connection
//    */
//   async testConnection() {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }
      
//       const blockNumber = await this.provider.getBlockNumber();
//       const owner = await this.contract.owner();
      
//       return {
//         success: true,
//         blockNumber: blockNumber,
//         contractOwner: owner,
//         connected: true
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.message,
//         connected: false
//       };
//     }
//   }
// }

// // Export singleton instance
// const blockchainIntegration = new BlockchainIntegration();

// export default blockchainIntegration;
import { ethers } from 'ethers';

// Contract ABI - matches your blockchain integration
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "transactionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "ngoId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "donorId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "cause", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "transactionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "ngoId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "receiverId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "cause", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "FundsSpent",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "ngoId", "type": "string"}],
    "name": "getNgoBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDonations",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getIncomingDonationsCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOutgoingTransactionsCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "getIncomingDonation",
    "outputs": [
      {"internalType": "uint256", "name": "transactionId", "type": "uint256"},
      {"internalType": "string", "name": "ngoId", "type": "string"},
      {"internalType": "string", "name": "donorId", "type": "string"},
      {"internalType": "string", "name": "cause", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "getOutgoingTransaction",
    "outputs": [
      {"internalType": "uint256", "name": "transactionId", "type": "uint256"},
      {"internalType": "string", "name": "ngoId", "type": "string"},
      {"internalType": "string", "name": "receiverId", "type": "string"},
      {"internalType": "string", "name": "cause", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "bytes32", "name": "verificationHash", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "limit", "type": "uint256"}],
    "name": "getActiveNgoIds",
    "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "ngoId", "type": "string"}],
    "name": "getNgoSummary",
    "outputs": [
      {"internalType": "uint256", "name": "totalReceived", "type": "uint256"},
      {"internalType": "uint256", "name": "totalSpent", "type": "uint256"},
      {"internalType": "uint256", "name": "incomingCount", "type": "uint256"},
      {"internalType": "uint256", "name": "outgoingCount", "type": "uint256"},
      {"internalType": "uint256", "name": "currentBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Configuration - Auto-detects environment (local vs production)
const CONFIG = {
  // Auto-detect environment and set appropriate RPC URL
  RPC_URL: (() => {
    // If running on localhost, use local Ganache
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:7545';
    }
    // For production/hosted frontend, use environment variable or fallback
    // Set VITE_BLOCKCHAIN_RPC_URL in your .env file for production (e.g., ngrok URL)
    return import.meta.env.VITE_BLOCKCHAIN_RPC_URL || 'http://localhost:7545';
  })(),
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x9fC0c4B491bC255f1d1486aD586d404b425afD8F',
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || '1337')
};

const BlockchainService = {
  provider: null,
  contract: null,
  cache: {
    transactions: null,
    incomingTransactions: null,
    outgoingTransactions: null,
    activeNgos: null,
    status: null,
    lastFetch: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
  },

  isCacheValid() {
    if (!this.cache.lastFetch) return false;
    return (Date.now() - this.cache.lastFetch) < this.cache.CACHE_DURATION;
  },

  clearCache() {
    this.cache.transactions = null;
    this.cache.incomingTransactions = null;
    this.cache.outgoingTransactions = null;
    this.cache.activeNgos = null;
    this.cache.status = null;
    this.cache.lastFetch = null;
  },

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL, {
        chainId: CONFIG.CHAIN_ID,
        name: "Ganache"
      });

      // Test connection
      await this.provider.getBlockNumber();
      
      // Initialize contract
      this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
      
      console.log('✅ Blockchain service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      return false;
    }
  },

  async getConnectionStatus() {
    try {
      if (!this.provider) return { connected: false, error: 'Provider not initialized' };
      
      // Return cached status if valid
      if (this.isCacheValid() && this.cache.status) {
        return this.cache.status;
      }
      
      const blockNumber = await this.provider.getBlockNumber();
      const totalDonations = await this.contract.totalDonations();
      
      const status = {
        connected: true,
        blockNumber,
        totalDonations: ethers.formatUnits(totalDonations, 0),
        contractAddress: CONFIG.CONTRACT_ADDRESS
      };
      
      this.cache.status = status;
      return status;
    } catch (error) {
      return { connected: false, error: error.message };
    }
  },

  async getAllIncomingTransactions(limit = 50) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      // Return cached data if valid
      if (this.isCacheValid() && this.cache.incomingTransactions) {
        return this.cache.incomingTransactions;
      }

      const totalCount = await this.contract.getIncomingDonationsCount();
      const count = Math.min(Number(totalCount), limit);
      const transactions = [];

      // Get latest transactions first (reverse order)
      for (let i = Number(totalCount) - 1; i >= Math.max(0, Number(totalCount) - count); i--) {
        try {
          const donation = await this.contract.getIncomingDonation(i);
          transactions.push({
            id: Number(donation[0]),
            ngoId: donation[1],
            donorId: donation[2],
            cause: donation[3],
            amount: ethers.formatUnits(donation[4], 0),
            timestamp: Number(donation[5]),
            type: 'incoming',
            date: new Date(Number(donation[5]) * 1000)
          });
        } catch (err) {
          console.warn(`Failed to fetch incoming transaction ${i}:`, err);
        }
      }

      // Enrich with NGO names from backend
      if (transactions.length > 0) {
        try {
          await this.enrichWithNgoNames(transactions);
        } catch (enrichError) {
          console.warn('Failed to enrich incoming transactions with NGO names:', enrichError);
          // Continue without names - not critical
        }
      }

      // Cache the result
      this.cache.incomingTransactions = transactions;
      this.cache.lastFetch = Date.now();

      return transactions;
    } catch (error) {
      console.error('Error fetching incoming transactions:', error);
      return [];
    }
  },

  async getAllOutgoingTransactions(limit = 50) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      // Return cached data if valid
      if (this.isCacheValid() && this.cache.outgoingTransactions) {
        return this.cache.outgoingTransactions;
      }

      const totalCount = await this.contract.getOutgoingTransactionsCount();
      const count = Math.min(Number(totalCount), limit);
      const transactions = [];

      // Get latest transactions first (reverse order)
      for (let i = Number(totalCount) - 1; i >= Math.max(0, Number(totalCount) - count); i--) {
        try {
          const transaction = await this.contract.getOutgoingTransaction(i);
          transactions.push({
            id: Number(transaction[0]),
            ngoId: transaction[1],
            receiverId: transaction[2],
            cause: transaction[3],
            amount: ethers.formatUnits(transaction[4], 0),
            timestamp: Number(transaction[5]),
            verificationHash: transaction[6] || null, // Add verification hash from contract
            type: 'outgoing',
            date: new Date(Number(transaction[5]) * 1000)
          });
        } catch (err) {
          console.warn(`Failed to fetch outgoing transaction ${i}:`, err);
        }
      }

      // Enrich with document metadata and NGO names from backend
      if (transactions.length > 0) {
        try {
          await this.enrichWithDocumentMetadata(transactions);
          await this.enrichWithNgoNames(transactions);
        } catch (enrichError) {
          console.warn('Failed to enrich with metadata:', enrichError);
          // Continue without metadata - not critical
        }
      }

      // Cache the result
      this.cache.outgoingTransactions = transactions;
      this.cache.lastFetch = Date.now();

      return transactions;
    } catch (error) {
      console.error('Error fetching outgoing transactions:', error);
      return [];
    }
  },

  async enrichWithDocumentMetadata(transactions) {
    try {
      // Extract receiverIds for metadata lookup
      const receiverIds = transactions.map(tx => tx.receiverId).filter(Boolean);
      
      if (receiverIds.length === 0) return;

      // Call backend metadata endpoint
      const response = await fetch(`/api/bank/blockchain-outgoing-metadata?receiverIds=${receiverIds.join(',')}`);
      
      if (!response.ok) {
        console.warn('Metadata endpoint returned error:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Create lookup map by receiverId
        const metadataMap = {};
        result.data.forEach(item => {
          metadataMap[item.receiverId] = item;
        });

        // Enrich transactions with metadata
        transactions.forEach(tx => {
          const metadata = metadataMap[tx.receiverId];
          if (metadata) {
            tx.documentUrl = metadata.document_url;
            tx.documentHash = metadata.document_hash;
            tx.ngoNotes = metadata.ngo_notes;
            tx.documentUploadedAt = metadata.document_uploaded_at ? new Date(metadata.document_uploaded_at) : null;
            tx.transactionId = metadata.transaction_id;
            tx.hasDocument = !!(metadata.document_url || metadata.document_hash);
          } else {
            tx.hasDocument = false;
          }
        });
      }
    } catch (error) {
      console.error('Error enriching with document metadata:', error);
      throw error;
    }
  },

  async enrichWithNgoNames(transactions) {
    try {
      // Extract unique ngoIds for name lookup
      const ngoIds = [...new Set(transactions.map(tx => tx.ngoId).filter(Boolean))];
      
      if (ngoIds.length === 0) return;

      // Call backend NGO names endpoint
      const response = await fetch(`/api/bank/ngo-names?ngoIds=${ngoIds.join(',')}`);
      
      if (!response.ok) {
        console.warn('NGO names endpoint returned error:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Enrich transactions with NGO full names
        transactions.forEach(tx => {
          const ngoFullName = result.data[tx.ngoId];
          if (ngoFullName) {
            tx.ngoFullName = ngoFullName;
          }
        });
        
        console.log('✅ Enriched transactions with NGO names:', Object.keys(result.data).length, 'NGOs found');
      }
    } catch (error) {
      console.error('Error enriching with NGO names:', error);
      throw error;
    }
  },

  async getAllTransactions(limit = 100) {
    try {
      const [incoming, outgoing] = await Promise.all([
        this.getAllIncomingTransactions(limit / 2),
        this.getAllOutgoingTransactions(limit / 2)
      ]);

      // Combine and sort by timestamp (latest first)
      const allTransactions = [...incoming, ...outgoing];
      return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  },

  async getNgoData(ngoId) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      // Try to get NGO balance first
      let balance = 0;
      try {
        const contractBalance = await this.contract.getNgoBalance(ngoId);
        balance = Number(ethers.formatUnits(contractBalance, 0));
      } catch (error) {
        console.warn('Could not fetch NGO balance from contract:', error);
      }

      // Fallback: Calculate data from transaction history
      const [incomingTx, outgoingTx] = await Promise.all([
        this.getNgoIncomingTransactions(ngoId, 1000),
        this.getNgoOutgoingTransactions(ngoId, 1000)
      ]);

      const totalReceived = incomingTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const totalSpent = outgoingTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const calculatedBalance = totalReceived - totalSpent;

      return {
        ngoId,
        balance: balance || calculatedBalance,
        totalReceived,
        totalSpent,
        incomingCount: incomingTx.length,
        outgoingCount: outgoingTx.length,
        currentBalance: balance || calculatedBalance,
        hasTransactions: incomingTx.length > 0 || outgoingTx.length > 0
      };
    } catch (error) {
      console.error('Error fetching NGO data:', error);
      return null;
    }
  },

  async getActiveNgos(limit = 100) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      // Return cached data if valid
      if (this.isCacheValid() && this.cache.activeNgos) {
        return this.cache.activeNgos;
      }
      
      const ngoIds = await this.contract.getActiveNgoIds(limit);
      const cleanNgoIds = ngoIds.map(id => id.trim()).filter(id => id);
      
      let result;
      
      // Enrich with NGO names if we have any IDs
      if (cleanNgoIds.length > 0) {
        try {
          const response = await fetch(`/api/bank/ngo-names?ngoIds=${cleanNgoIds.join(',')}`);
          
          if (response.ok) {
            const apiResult = await response.json();
            
            if (apiResult.success && apiResult.data) {
              // Return objects with both ID and name
              result = cleanNgoIds.map(ngoId => ({
                id: ngoId,
                fullName: apiResult.data[ngoId] || null
              }));
            }
          }
        } catch (enrichError) {
          console.warn('Failed to enrich active NGOs with names:', enrichError);
        }
      }
      
      // Fallback: return just IDs as objects for consistency
      if (!result) {
        result = cleanNgoIds.map(ngoId => ({ id: ngoId, fullName: null }));
      }
      
      // Cache the result
      this.cache.activeNgos = result;
      this.cache.lastFetch = Date.now();
      
      return result;
    } catch (error) {
      console.error('Error fetching active NGOs:', error);
      return [];
    }
  },

  // NGO-specific transaction methods
  async getNgoTransactions(ngoId, limit = 50) {
    try {
      const [incoming, outgoing] = await Promise.all([
        this.getNgoIncomingTransactions(ngoId, limit),
        this.getNgoOutgoingTransactions(ngoId, limit)
      ]);

      // Combine and sort by timestamp (newest first)
      const allTx = [...incoming, ...outgoing];
      allTx.sort((a, b) => b.timestamp - a.timestamp);

      return allTx.slice(0, limit);
    } catch (error) {
      console.error('Error fetching NGO transactions:', error);
      return [];
    }
  },

  async getNgoIncomingTransactions(ngoId, limit = 50) {
    try {
      const allIncoming = await this.getAllIncomingTransactions(1000); // Get more to filter
      return allIncoming.filter(tx => tx.ngoId === ngoId).slice(0, limit);
    } catch (error) {
      console.error('Error fetching NGO incoming transactions:', error);
      return [];
    }
  },

  async getNgoOutgoingTransactions(ngoId, limit = 50) {
    try {
      const allOutgoing = await this.getAllOutgoingTransactions(1000); // Get more to filter
      return allOutgoing.filter(tx => tx.ngoId === ngoId).slice(0, limit);
    } catch (error) {
      console.error('Error fetching NGO outgoing transactions:', error);
      return [];
    }
  },

  // Alias for backward compatibility
  async getNgoSummary(ngoId) {
    return this.getNgoData(ngoId);
  }
};

export default BlockchainService;
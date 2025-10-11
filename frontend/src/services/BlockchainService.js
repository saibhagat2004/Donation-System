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
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
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
      
      const blockNumber = await this.provider.getBlockNumber();
      const totalDonations = await this.contract.totalDonations();
      
      return {
        connected: true,
        blockNumber,
        totalDonations: ethers.formatUnits(totalDonations, 0),
        contractAddress: CONFIG.CONTRACT_ADDRESS
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  },

  async getAllIncomingTransactions(limit = 50) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

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

      return transactions;
    } catch (error) {
      console.error('Error fetching incoming transactions:', error);
      return [];
    }
  },

  async getAllOutgoingTransactions(limit = 50) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

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
            type: 'outgoing',
            date: new Date(Number(transaction[5]) * 1000)
          });
        } catch (err) {
          console.warn(`Failed to fetch outgoing transaction ${i}:`, err);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching outgoing transactions:', error);
      return [];
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
      
      const ngoIds = await this.contract.getActiveNgoIds(limit);
      return ngoIds.map(id => id.trim()).filter(id => id);
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
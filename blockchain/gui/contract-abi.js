const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "donorId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "receiverId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "verificationHash",
        "type": "bytes32"
      }
    ],
    "name": "FundsSpent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newBalance",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "action",
        "type": "string"
      }
    ],
    "name": "NgoBalanceUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getActiveNgoIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getIncomingDonation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "donorId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getIncomingDonationsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      }
    ],
    "name": "getNgoBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getNgoIncomingTransaction",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "donorId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      }
    ],
    "name": "getNgoIncomingTransactionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getNgoOutgoingTransaction",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "receiverId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "verificationHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      }
    ],
    "name": "getNgoOutgoingTransactionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      }
    ],
    "name": "getNgoSummary",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalReceived",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalSpent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "incomingCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "outgoingCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentBalance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getOutgoingTransaction",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "transactionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "receiverId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "verificationHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOutgoingTransactionsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "donorId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "recordDonation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "initialBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "recordDate",
        "type": "uint256"
      }
    ],
    "name": "recordInitialBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ngoId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "receiverId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "cause",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "verificationHash",
        "type": "bytes32"
      }
    ],
    "name": "recordSpending",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDonations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
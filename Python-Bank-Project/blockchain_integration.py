#!/usr/bin/env python3
"""
Blockchain Integration Module for Banking System
Handles recording donations on the blockchain smart contract
"""

import json
import time
import requests
from web3 import Web3

# Configuration
GANACHE_URL = "http://127.0.0.1:7545"  # Ganache RPC URL
CONTRACT_ADDRESS = "0x9fC0c4B491bC255f1d1486aD586d404b425afD8F"  # From contract-address.json
CHAIN_ID = 1337  # Ganache chain ID

# Contract ABI (updated from contract-abi.js)
CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "transactionId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "ngoId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "donorId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "cause", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "DonationReceived",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "transactionId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "ngoId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "receiverId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "cause", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"indexed": False, "internalType": "bytes32", "name": "verificationHash", "type": "bytes32"}
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
        "inputs": [
            {"internalType": "string", "name": "ngoId", "type": "string"},
            {"internalType": "string", "name": "donorId", "type": "string"},
            {"internalType": "string", "name": "cause", "type": "string"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "recordDonation",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "ngoId", "type": "string"},
            {"internalType": "string", "name": "receiverId", "type": "string"},
            {"internalType": "string", "name": "cause", "type": "string"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "bytes32", "name": "verificationHash", "type": "bytes32"}
        ],
        "name": "recordSpending",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
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
    }
]

class BlockchainIntegration:
    def __init__(self):
        self.web3 = None
        self.contract = None
        self.account = None
        self.is_connected = False
        
    def connect(self):
        """Connect to Ganache blockchain"""
        try:
            # Connect to Ganache
            self.web3 = Web3(Web3.HTTPProvider(GANACHE_URL))
            
            # Check connection
            if not self.web3.is_connected():
                raise Exception("Failed to connect to Ganache")
            
            # Get accounts (use first account as default)
            accounts = self.web3.eth.accounts
            if not accounts:
                raise Exception("No accounts found in Ganache")
            
            # Use the specified Ganache account
            self.account = "0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0"
            
            # Load contract
            self.contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(CONTRACT_ADDRESS),
                abi=CONTRACT_ABI
            )
            
            self.is_connected = True
            print(f"✅ Connected to blockchain successfully")
            print(f"   Account: {self.account}")
            print(f"   Contract: {CONTRACT_ADDRESS}")
            
            return True
            
        except Exception as e:
            print(f"❌ Blockchain connection failed: {e}")
            self.is_connected = False
            return False
    
    def record_donation_on_blockchain(self, ngo_account, donor_id, cause, amount):
        """
        Record a donation on the blockchain smart contract
        
        Args:
            ngo_account (str): NGO's bank account number (used as NGO ID)
            donor_id (str): Donor's identification (MongoDB ObjectID from donation system)
            cause (str): Purpose of the donation (education, health, etc.)
            amount (int): Donation amount in rupees
            
        Returns:
            dict: Result with success status and transaction details
        """
        if not self.is_connected:
            if not self.connect():
                return {
                    'success': False,
                    'error': 'Blockchain connection failed',
                    'tx_hash': None,
                    'blockchain_tx_id': None
                }
        
        try:
            # Prepare transaction parameters
            ngo_id = f"NGO_{ngo_account}"  # Convert bank account to NGO ID
            timestamp = int(time.time())
            
            print(f"🔗 Recording donation on blockchain:")
            print(f"   NGO ID: {ngo_id}")
            print(f"   Donor ID: {donor_id}")
            print(f"   Cause: {cause}")
            print(f"   Amount: ₹{amount}")
            
            # For Ganache (unlocked accounts), we can send transaction directly
            tx_hash = self.contract.functions.recordDonation(
                ngo_id,
                donor_id,
                cause or "general",  # Default to "general" if no cause provided
                amount,
                timestamp
            ).transact({
                'from': self.account,
                'gas': 500000
            })
            
            print(f"📤 Transaction sent: {tx_hash.hex()}")
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            
            if tx_receipt.status == 1:
                # Parse logs to get the blockchain transaction ID
                blockchain_tx_id = None
                if tx_receipt.logs:
                    try:
                        # Parse the DonationReceived event
                        donation_event = self.contract.events.DonationReceived().process_log(tx_receipt.logs[0])
                        blockchain_tx_id = donation_event['args']['transactionId']
                    except Exception as log_error:
                        print(f"⚠️ Could not parse transaction ID from logs: {log_error}")
                
                print(f"✅ Donation recorded on blockchain successfully!")
                print(f"   Transaction Hash: {tx_hash.hex()}")
                print(f"   Blockchain Transaction ID: {blockchain_tx_id}")
                
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'blockchain_tx_id': blockchain_tx_id,
                    'block_number': tx_receipt.blockNumber,
                    'gas_used': tx_receipt.gasUsed
                }
            else:
                return {
                    'success': False,
                    'error': 'Transaction failed on blockchain',
                    'tx_hash': tx_hash.hex(),
                    'blockchain_tx_id': None
                }
                
        except Exception as e:
            print(f"❌ Error recording donation on blockchain: {e}")
            return {
                'success': False,
                'error': str(e),
                'tx_hash': None,
                'blockchain_tx_id': None
            }
    
    def record_spending_on_blockchain(self, ngo_account, receiver_id, cause, amount):
        """
        Record spending/withdrawal on the blockchain smart contract
        
        Args:
            ngo_account (str): NGO's bank account number (used as NGO ID)
            receiver_id (str): Receiver of the funds (for withdrawals, this could be the account holder)
            cause (str): Purpose of the spending (Cash Withdrawal, Fund Transfer, etc.)
            amount (int): Amount spent in rupees
            
        Returns:
            dict: Result with success status and transaction details
        """
        if not self.is_connected:
            if not self.connect():
                return {
                    'success': False,
                    'error': 'Blockchain connection failed',
                    'tx_hash': None,
                    'blockchain_tx_id': None
                }
        
        try:
            # Prepare transaction parameters
            ngo_id = f"NGO_{ngo_account}"
            timestamp = int(time.time())
            verification_hash = self.web3.keccak(text=f"spending_{ngo_account}_{timestamp}")
            
            print(f"🔗 Recording spending on blockchain:")
            print(f"   NGO ID: {ngo_id}")
            print(f"   Receiver ID: {receiver_id}")
            print(f"   Cause: {cause}")
            print(f"   Amount: ₹{amount}")
            
            # Record spending on blockchain using recordSpending function
            tx_hash = self.contract.functions.recordSpending(
                ngo_id,
                receiver_id,
                cause or "general_spending",
                amount,
                timestamp,
                verification_hash
            ).transact({
                'from': self.account,
                'gas': 500000
            })
            
            print(f"📤 Spending transaction sent: {tx_hash.hex()}")
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            
            if tx_receipt.status == 1:
                # Parse logs to get the blockchain transaction ID
                blockchain_tx_id = None
                if tx_receipt.logs:
                    try:
                        # Parse the FundsSpent event
                        funds_spent_event = self.contract.events.FundsSpent().process_log(tx_receipt.logs[0])
                        blockchain_tx_id = funds_spent_event['args']['transactionId']
                    except Exception as log_error:
                        print(f"⚠️ Could not parse transaction ID from logs: {log_error}")
                
                print(f"✅ Spending recorded on blockchain successfully!")
                print(f"   Transaction Hash: {tx_hash.hex()}")
                print(f"   Blockchain Transaction ID: {blockchain_tx_id}")
                
                return {
                    'success': True,
                    'tx_hash': tx_hash.hex(),
                    'blockchain_tx_id': blockchain_tx_id,
                    'block_number': tx_receipt.blockNumber,
                    'gas_used': tx_receipt.gasUsed
                }
            else:
                return {
                    'success': False,
                    'error': 'Transaction failed on blockchain',
                    'tx_hash': tx_hash.hex(),
                    'blockchain_tx_id': None
                }
                
        except Exception as e:
            print(f"❌ Error recording spending on blockchain: {e}")
            return {
                'success': False,
                'error': str(e),
                'tx_hash': None,
                'blockchain_tx_id': None
            }

    def get_ngo_balance_from_blockchain(self, ngo_account):
        """Get NGO balance from blockchain"""
        if not self.is_connected:
            if not self.connect():
                return None
        
        try:
            ngo_id = f"NGO_{ngo_account}"
            balance = self.contract.functions.getNgoBalance(ngo_id).call()
            return balance
        except Exception as e:
            print(f"❌ Error getting NGO balance from blockchain: {e}")
            return None
    
    def _get_private_key(self):
        """
        Get private key for signing transactions
        In production, use proper key management (env vars, key stores, etc.)
        For Ganache development, use the specified test key
        """
        # Your specific Ganache account private key
        # This is a test key for development only - NEVER use in production
        if self.account == "0x35b6cdc6F2a0990d38d232eEe6007846B531d5a0":
            return "0x69c3cf937091d5c71fe45ca0e738e5c54c96ddc233e8b"
        
        # Fallback - this shouldn't happen with the fixed account
        print(f"⚠️ Unknown account: {self.account}")
        return None
    
    def get_blockchain_status(self):
        """Get blockchain connection status and basic info"""
        if not self.is_connected:
            return {
                'connected': False,
                'error': 'Not connected to blockchain'
            }
        
        try:
            latest_block = self.web3.eth.block_number
            total_donations = self.contract.functions.totalDonations().call()
            
            return {
                'connected': True,
                'latest_block': latest_block,
                'contract_address': CONTRACT_ADDRESS,
                'account': self.account,
                'total_donations_on_chain': total_donations,
                'chain_id': CHAIN_ID
            }
        except Exception as e:
            return {
                'connected': False,
                'error': str(e)
            }

# Global instance
blockchain = BlockchainIntegration()

# Test function
if __name__ == "__main__":
    # Test the blockchain integration
    print("🧪 Testing Blockchain Integration...")
    
    # Connect to blockchain
    if blockchain.connect():
        print("\n📊 Blockchain Status:")
        status = blockchain.get_blockchain_status()
        for key, value in status.items():
            print(f"   {key}: {value}")
        
        # Test recording a donation
        print("\n🎯 Testing donation recording...")
        result = blockchain.record_donation_on_blockchain(
            ngo_account="12345678",
            donor_id="TEST_DONOR_001", 
            cause="education",
            amount=500
        )
        
        print(f"\n📋 Result: {json.dumps(result, indent=2)}")
    else:
        print("❌ Failed to connect to blockchain")
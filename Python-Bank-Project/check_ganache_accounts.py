#!/usr/bin/env python3
"""
Check Ganache accounts and balances
"""

from web3 import Web3

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

if web3.is_connected():
    print("✅ Connected to Ganache")
    print(f"Latest block: {web3.eth.block_number}")
    
    accounts = web3.eth.accounts
    print(f"\n📋 Found {len(accounts)} accounts:")
    
    for i, account in enumerate(accounts):
        balance = web3.eth.get_balance(account)
        balance_eth = web3.from_wei(balance, 'ether')
        print(f"   Account {i}: {account}")
        print(f"   Balance: {balance_eth} ETH")
        print()
else:
    print("❌ Failed to connect to Ganache")
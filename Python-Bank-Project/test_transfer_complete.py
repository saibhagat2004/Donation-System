#!/usr/bin/env python3
"""
Add funds and test transfer
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def add_funds_and_test():
    print("💰 Adding funds to account...")
    
    # Add funds first
    deposit_data = {
        "username": "saibhagat",
        "amount": 1000,
        "account_number": 15083762,
        "donor_id": "funds_for_transfer_test",
        "cause": "Adding funds for transfer test"
    }
    
    response = requests.post(f"{BASE_URL}/api/deposit", json=deposit_data)
    if response.status_code == 200:
        print("✅ Funds added successfully")
    else:
        print("❌ Failed to add funds")
        return
    
    # Now test transfer
    transfer_data = {
        "username": "saibhagat",
        "receiver_account": 24404357,
        "amount": 200,
        "account_number": 15083762,
        "donor_id": "api_transfer_test",
        "cause": "API Transfer Test"
    }
    
    print(f"\n🔄 Testing transfer...")
    response = requests.post(f"{BASE_URL}/api/transfer", json=transfer_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Transfer successful!")
        
        blockchain_info = result.get('blockchain', {})
        
        # Show detailed transaction info
        spending_tx = blockchain_info.get('spending_tx', {})
        donation_tx = blockchain_info.get('donation_tx', {})
        
        print(f"\n📤 Spending Transaction (Should appear in OUTGOING tab):")
        print(f"   Success: {spending_tx.get('success', False)}")
        print(f"   TX Hash: {spending_tx.get('tx_hash', 'N/A')}")
        print(f"   TX ID: {spending_tx.get('blockchain_tx_id', 'N/A')}")
        
        print(f"\n📥 Donation Transaction (Should appear in INCOMING tab):")
        print(f"   Success: {donation_tx.get('success', False)}")
        print(f"   TX Hash: {donation_tx.get('tx_hash', 'N/A')}")
        print(f"   TX ID: {donation_tx.get('blockchain_tx_id', 'N/A')}")
        
        print(f"\n🎯 What to check in blockchain UI:")
        print(f"   1. OUTGOING tab → Look for TX ID {spending_tx.get('blockchain_tx_id')} from NGO_15083762")
        print(f"   2. INCOMING tab → Look for TX ID {donation_tx.get('blockchain_tx_id')} to NGO_24404357")
        
    else:
        print(f"❌ Transfer failed: {response.status_code}")
        try:
            print(f"Error: {response.json()}")
        except:
            print(f"Raw: {response.text}")

if __name__ == "__main__":
    add_funds_and_test()
#!/usr/bin/env python3
"""
Test Fund Transfer API with Blockchain
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_transfer_api():
    print("🧪 Testing Fund Transfer API with Blockchain...")
    
    # Step 1: Perform transfer
    transfer_data = {
        "username": "saibhagat", 
        "receiver_account": 24404357,
        "amount": 150,
        "account_number": 15083762,
        "donor_id": "api_transfer_test",
        "cause": "API Transfer Test"
    }
    
    print(f"Transfer Data: {json.dumps(transfer_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/api/transfer", json=transfer_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Transfer successful!")
        print(f"Message: {result.get('message')}")
        print(f"New Balance: ₹{result.get('new_balance')}")
        
        blockchain_info = result.get('blockchain', {})
        print(f"\n🔗 Blockchain Results:")
        print(f"   Recorded: {blockchain_info.get('recorded')}")
        print(f"   Primary TX Hash: {blockchain_info.get('tx_hash')}")
        print(f"   Primary TX ID: {blockchain_info.get('blockchain_tx_id')}")
        
        # Show detailed transaction info
        spending_tx = blockchain_info.get('spending_tx', {})
        donation_tx = blockchain_info.get('donation_tx', {})
        
        print(f"\n📤 Spending Transaction (Outgoing):")
        print(f"   Success: {spending_tx.get('success', False)}")
        print(f"   TX Hash: {spending_tx.get('tx_hash', 'N/A')}")
        print(f"   TX ID: {spending_tx.get('blockchain_tx_id', 'N/A')}")
        
        print(f"\n📥 Donation Transaction (Incoming):")
        print(f"   Success: {donation_tx.get('success', False)}")
        print(f"   TX Hash: {donation_tx.get('tx_hash', 'N/A')}")
        print(f"   TX ID: {donation_tx.get('blockchain_tx_id', 'N/A')}")
        
        if blockchain_info.get('error'):
            print(f"   ❌ Error: {blockchain_info['error']}")
        else:
            print(f"\n   ✅ Transfer recorded on blockchain!")
        
        return blockchain_info.get('blockchain_tx_id')
    else:
        print(f"❌ Transfer failed: {response.status_code}")
        try:
            error_info = response.json()
            print(f"Error: {error_info}")
        except:
            print(f"Raw: {response.text}")
        return None

if __name__ == "__main__":
    tx_id = test_transfer_api()
    if tx_id:
        print(f"\n🎯 Check blockchain UI for Transaction ID: {tx_id}")
        print(f"   - Should appear in OUTGOING tab as spending from NGO_15083762")
        print(f"   - Should show receiver: transfer_to_24404357")
        print(f"   - Amount: ₹150")
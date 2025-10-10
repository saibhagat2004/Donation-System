#!/usr/bin/env python3
"""
Simple Withdrawal Test
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_simple_withdrawal():
    # Test withdrawal for existing user
    withdrawal_data = {
        "username": "saibhagat",
        "amount": 100,
        "account_number": 15083762,
        "donor_id": "test_withdrawal_simple",
        "cause": "Test Cash Withdrawal"
    }
    
    print("🧪 Testing Simple Withdrawal...")
    print(f"Data: {json.dumps(withdrawal_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/api/withdraw", json=withdrawal_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Withdrawal successful!")
        print(f"Message: {result.get('message')}")
        
        blockchain_info = result.get('blockchain', {})
        print(f"\n🔗 Blockchain Results:")
        print(f"   Recorded: {blockchain_info.get('recorded')}")
        print(f"   TX Hash: {blockchain_info.get('tx_hash')}")
        print(f"   Blockchain TX ID: {blockchain_info.get('blockchain_tx_id')}")
        if blockchain_info.get('error'):
            print(f"   Error: {blockchain_info['error']}")
    else:
        print(f"❌ Withdrawal failed: {response.status_code}")
        try:
            print(f"Error: {response.json()}")
        except:
            print(f"Raw: {response.text}")

if __name__ == "__main__":
    test_simple_withdrawal()
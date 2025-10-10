#!/usr/bin/env python3
"""
Test the complete donation flow with blockchain integration
"""

import requests
import json

# Bank API configuration
BANK_API_URL = "http://localhost:5050"

def test_donation_with_blockchain():
    """Test a donation and verify it gets recorded on blockchain"""
    
    print("🧪 Testing Complete Donation Flow with Blockchain Integration")
    print("=" * 60)
    
    # Test data
    test_donation = {
        "account_number": 12345678,
        "amount": 1000,
        "donor_id": "DONOR_TEST_001",
        "cause": "education"
    }
    
    print(f"📤 Sending donation: ₹{test_donation['amount']} for {test_donation['cause']}")
    print(f"   To Account: {test_donation['account_number']}")
    print(f"   Donor ID: {test_donation['donor_id']}")
    
    # Make donation API call
    try:
        response = requests.post(
            f"{BANK_API_URL}/api/add_money",
            json=test_donation,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Banking API Response:")
            print(f"   Success: {result['success']}")
            print(f"   Message: {result['message']}")
            print(f"   New Balance: ₹{result['new_balance']}")
            
            # Check blockchain integration results
            blockchain_info = result.get('blockchain', {})
            print(f"\n🔗 Blockchain Integration:")
            print(f"   Recorded: {blockchain_info.get('recorded', False)}")
            
            if blockchain_info.get('recorded'):
                print(f"   ✅ Transaction Hash: {blockchain_info.get('tx_hash')}")
                print(f"   ✅ Blockchain TX ID: {blockchain_info.get('blockchain_tx_id')}")
            else:
                print(f"   ❌ Error: {blockchain_info.get('error', 'Unknown error')}")
                
        else:
            print(f"❌ Banking API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_blockchain_status():
    """Test blockchain status endpoint"""
    
    print(f"\n📊 Testing Blockchain Status API")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BANK_API_URL}/api/blockchain/status", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            blockchain_status = result.get('blockchain_status', {})
            
            print(f"✅ Blockchain Status:")
            print(f"   Connected: {blockchain_status.get('connected', False)}")
            print(f"   Contract: {blockchain_status.get('contract_address', 'Unknown')}")
            print(f"   Account: {blockchain_status.get('account', 'Unknown')}")
            print(f"   Latest Block: {blockchain_status.get('latest_block', 'Unknown')}")
            print(f"   Total Donations: {blockchain_status.get('total_donations_on_chain', 'Unknown')}")
        else:
            print(f"❌ Status API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Status request failed: {e}")

if __name__ == "__main__":
    # Test blockchain status first
    test_blockchain_status()
    
    # Test donation flow
    test_donation_with_blockchain()
    
    print(f"\n🎯 Test completed!")
    print(f"\nNow you can:")
    print(f"1. Check your bank account transactions in the passbook")
    print(f"2. Verify the donation on the blockchain using the GUI")
    print(f"3. See the cause 'education' recorded in both systems")
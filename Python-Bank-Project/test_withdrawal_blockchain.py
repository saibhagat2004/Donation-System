#!/usr/bin/env python3
"""
Test Withdrawal as Blockchain Spending Transaction
Tests that withdrawals are now properly recorded as outgoing transactions in blockchain UI
"""

import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:5050"
TEST_USER = "withdrawal_test_user"
TEST_PASSWORD = "test123"

def test_withdrawal_blockchain():
    """Test withdrawal being recorded as outgoing transaction on blockchain"""
    print("🧪 Testing Withdrawal as Blockchain Spending Transaction")
    print("=" * 60)
    
    # Step 1: Create/Login test user
    signup_data = {
        "username": TEST_USER,
        "password": TEST_PASSWORD,
        "name": "Withdrawal Test User",
        "age": 25,
        "city": "Test City"
    }
    
    print("1️⃣ Creating test user...")
    response = requests.post(f"{BASE_URL}/api/signup", json=signup_data)
    
    if response.status_code == 200:
        result = response.json()
        test_account = result.get('account_number')
        print(f"✅ Account created: {test_account}")
    elif response.status_code == 400:
        # User exists, try login
        signin_data = {"username": TEST_USER, "password": TEST_PASSWORD}
        response = requests.post(f"{BASE_URL}/api/signin", json=signin_data)
        if response.status_code == 200:
            result = response.json()
            test_account = result['user']['account_number']
            print(f"✅ Using existing account: {test_account}")
        else:
            print("❌ Failed to create or login user")
            return
    else:
        print("❌ Failed to create user")
        return
    
    # Step 2: Add some money first (so we can withdraw)
    deposit_data = {
        "username": TEST_USER,
        "amount": 2000,
        "account_number": test_account,
        "donor_id": "deposit_for_withdrawal_test",
        "cause": "test_fund_for_withdrawal"
    }
    
    print("\n2️⃣ Adding funds to account...")
    response = requests.post(f"{BASE_URL}/api/deposit", json=deposit_data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Deposit successful: ₹{deposit_data['amount']}")
        print(f"   Blockchain recorded: {result.get('blockchain', {}).get('recorded', False)}")
        print(f"   TX Hash: {result.get('blockchain', {}).get('tx_hash', 'N/A')}")
    else:
        print("❌ Deposit failed")
        return
    
    # Step 3: Perform withdrawal (should record as spending on blockchain)
    withdrawal_data = {
        "username": TEST_USER,
        "amount": 500,
        "account_number": test_account,
        "donor_id": "withdrawal_test_user_cash",
        "cause": "ATM Cash Withdrawal"
    }
    
    print(f"\n3️⃣ Performing withdrawal...")
    response = requests.post(f"{BASE_URL}/api/withdraw", json=withdrawal_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Withdrawal successful: ₹{withdrawal_data['amount']}")
        
        blockchain_info = result.get('blockchain', {})
        print(f"\n🔗 Blockchain Integration Results:")
        print(f"   Recorded: {blockchain_info.get('recorded', False)}")
        print(f"   TX Hash: {blockchain_info.get('tx_hash', 'N/A')}")
        print(f"   Blockchain TX ID: {blockchain_info.get('blockchain_tx_id', 'N/A')}")
        if blockchain_info.get('error'):
            print(f"   Error: {blockchain_info['error']}")
        
        if blockchain_info.get('recorded'):
            print(f"\n✅ SUCCESS: Withdrawal recorded on blockchain!")
            print(f"   This should now appear in 'Outgoing' transactions in blockchain UI")
            print(f"   NGO ID: NGO_{test_account}")
            print(f"   Receiver: {withdrawal_data['donor_id']}")
            print(f"   Cause: {withdrawal_data['cause']}")
            print(f"   Amount: ₹{withdrawal_data['amount']}")
        else:
            print(f"\n❌ FAILED: Withdrawal not recorded on blockchain")
            
    else:
        print("❌ Withdrawal failed")
        try:
            error_info = response.json()
            print(f"Error: {error_info}")
        except:
            print(f"Raw response: {response.text}")
    
    # Step 4: Check blockchain status
    print(f"\n4️⃣ Checking blockchain status...")
    response = requests.get(f"{BASE_URL}/api/blockchain/status")
    if response.status_code == 200:
        status = response.json()
        blockchain_status = status.get('blockchain_status', {})
        print(f"✅ Blockchain Status:")
        print(f"   Connected: {blockchain_status.get('connected', False)}")
        print(f"   Latest Block: {blockchain_status.get('latest_block', 'Unknown')}")
        print(f"   Total Donations: ₹{blockchain_status.get('total_donations_on_chain', 'Unknown')}")
        print(f"   Contract: {blockchain_status.get('contract_address', 'Unknown')}")
    else:
        print("❌ Failed to get blockchain status")
    
    print(f"\n🎯 Next Steps:")
    print(f"   1. Open blockchain GUI: d:/Project/Donation-System/blockchain/gui/index.html")
    print(f"   2. Connect to Ganache")
    print(f"   3. Check 'Outgoing' tab for withdrawal transaction")
    print(f"   4. Look for NGO_ID: NGO_{test_account}")
    
    print("=" * 60)

if __name__ == "__main__":
    test_withdrawal_blockchain()
#!/usr/bin/env python3
"""
Complete Banking + Blockchain Integration Test
Tests all banking operations (deposit, withdraw, transfer, donation) with blockchain recording
"""

import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:5050"
TEST_USER = "blockchain_test_user"
TEST_PASSWORD = "test123"
RECEIVER_ACCOUNT = 1234567890  # Existing account for transfers

def test_operation(operation_name, endpoint, data, expected_status=200):
    """Test a banking operation and verify blockchain integration"""
    print(f"\n🧪 Testing {operation_name}...")
    print(f"Endpoint: {endpoint}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}{endpoint}", json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == expected_status:
            result = response.json()
            print(f"✅ {operation_name} successful!")
            print(f"Message: {result.get('message', 'No message')}")
            
            # Check blockchain integration
            blockchain_info = result.get('blockchain', {})
            if blockchain_info:
                print(f"🔗 Blockchain Integration:")
                print(f"   Recorded: {blockchain_info.get('recorded', False)}")
                print(f"   TX Hash: {blockchain_info.get('tx_hash', 'N/A')}")
                print(f"   Blockchain TX ID: {blockchain_info.get('blockchain_tx_id', 'N/A')}")
                if blockchain_info.get('error'):
                    print(f"   ❌ Error: {blockchain_info['error']}")
                else:
                    print(f"   ✅ Successfully recorded on blockchain!")
            else:
                print(f"⚠️ No blockchain information returned")
            
            return result
        else:
            print(f"❌ {operation_name} failed with status {response.status_code}")
            try:
                error_info = response.json()
                print(f"Error: {error_info}")
            except:
                print(f"Raw response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception during {operation_name}: {e}")
        return None

def main():
    print("🚀 Starting Complete Banking + Blockchain Integration Test")
    print("=" * 60)
    
    # Test 1: User Signup (if not exists)
    signup_data = {
        "username": TEST_USER,
        "password": TEST_PASSWORD,
        "name": "Blockchain Test User",
        "age": 25,
        "city": "Test City"
    }
    
    print(f"\n1️⃣ Creating test user account...")
    signup_result = test_operation("User Signup", "/api/signup", signup_data)
    
    if signup_result:
        test_account = signup_result.get('account_number')
        print(f"Test Account Number: {test_account}")
    else:
        # Try to sign in (user might already exist)
        signin_data = {
            "username": TEST_USER,
            "password": TEST_PASSWORD
        }
        signin_result = test_operation("User Signin", "/api/signin", signin_data)
        if signin_result:
            test_account = signin_result['user']['account_number']
            print(f"Using existing account: {test_account}")
        else:
            print("❌ Cannot create or access test user account")
            return
    
    # Wait a moment for account creation to complete
    time.sleep(2)
    
    # Test 2: Cash Deposit with Blockchain Recording
    deposit_data = {
        "username": TEST_USER,
        "amount": 1000,
        "account_number": test_account,
        "donor_id": "cash_deposit_test",
        "cause": "test_deposit"
    }
    
    print(f"\n2️⃣ Testing Cash Deposit...")
    test_operation("Cash Deposit", "/api/deposit", deposit_data)
    
    # Test 3: Cash Withdrawal with Blockchain Recording  
    withdraw_data = {
        "username": TEST_USER,
        "amount": 200,
        "account_number": test_account,
        "donor_id": "cash_withdrawal_test",
        "cause": "test_withdrawal"
    }
    
    print(f"\n3️⃣ Testing Cash Withdrawal...")
    test_operation("Cash Withdrawal", "/api/withdraw", withdraw_data)
    
    # Test 4: Fund Transfer with Blockchain Recording
    # First create a receiver account for testing
    receiver_signup_data = {
        "username": "receiver_test_user",
        "password": "test123",
        "name": "Receiver Test User",
        "age": 25,
        "city": "Test City"
    }
    
    print(f"\n4️⃣ Creating receiver account for transfer test...")
    receiver_result = test_operation("Receiver Signup", "/api/signup", receiver_signup_data)
    
    if receiver_result:
        receiver_account = receiver_result.get('account_number')
    else:
        # Try to sign in (receiver might already exist)
        receiver_signin_data = {
            "username": "receiver_test_user",
            "password": "test123"
        }
        receiver_signin_result = test_operation("Receiver Signin", "/api/signin", receiver_signin_data)
        if receiver_signin_result:
            receiver_account = receiver_signin_result['user']['account_number']
        else:
            print("⚠️ Using sender account as receiver for testing")
            receiver_account = test_account
    
    transfer_data = {
        "username": TEST_USER,
        "receiver_account": receiver_account,
        "amount": 300,
        "account_number": test_account,
        "donor_id": "transfer_test",
        "cause": "test_transfer"
    }
    
    print(f"\n5️⃣ Testing Fund Transfer...")
    test_operation("Fund Transfer", "/api/transfer", transfer_data)
    
    # Test 6: Website Donation (add_money) with Blockchain Recording
    donation_data = {
        "account_number": test_account,
        "amount": 500,
        "donor_id": "website_donation_test",
        "cause": "education"
    }
    
    print(f"\n6️⃣ Testing Website Donation...")
    test_operation("Website Donation", "/api/add_money", donation_data)
    
    # Test 7: Check Blockchain Status
    print(f"\n7️⃣ Checking Blockchain Status...")
    try:
        response = requests.get(f"{BASE_URL}/api/blockchain/status")
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Blockchain Status Retrieved!")
            print(f"Status: {json.dumps(status, indent=2)}")
        else:
            print(f"❌ Failed to get blockchain status: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception getting blockchain status: {e}")
    
    print(f"\n✅ Complete Banking + Blockchain Integration Test Finished!")
    print("=" * 60)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Check Contract Owner and Available Functions
"""

from blockchain_integration import blockchain

def check_contract_info():
    print("🔍 Checking Contract Information...")
    
    # Connect to blockchain
    if not blockchain.connect():
        print("❌ Failed to connect to blockchain")
        return
    
    try:
        # Check contract owner
        owner = blockchain.contract.functions.owner().call()
        print(f"Contract Owner: {owner}")
        print(f"Our Account:    {blockchain.account}")
        print(f"Are we owner?   {owner.lower() == blockchain.account.lower()}")
        
        # Check total donations to verify contract is working
        total_donations = blockchain.contract.functions.totalDonations().call()
        print(f"Total Donations on Chain: ₹{total_donations}")
        
        # Test if we can call recordSpending
        print(f"\n🧪 Testing recordSpending permissions...")
        
        # Try to get NGO balance first
        ngo_id = "NGO_15083762"
        try:
            balance = blockchain.contract.functions.getNgoBalance(ngo_id).call()
            print(f"NGO {ngo_id} balance: ₹{balance}")
            
            if balance > 0:
                print(f"NGO has funds, testing recordSpending call...")
                # This will fail if we're not the owner, but let's see the exact error
            else:
                print(f"NGO has no funds, can't test spending")
                
        except Exception as e:
            print(f"Error getting NGO balance: {e}")
        
    except Exception as e:
        print(f"❌ Error checking contract info: {e}")

if __name__ == "__main__":
    check_contract_info()
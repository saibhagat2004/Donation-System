#!/usr/bin/env python
"""
Test script to verify fund transfer specifically between Krish and Saibhagat
"""
import os
import sqlite3
from bank import Bank

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_account_info(username):
    """Get account info for a username"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "username": user["username"],
            "account": user["account_number"],
            "balance": user["balance"]
        }
    return None

def clear_transactions(username):
    """Clear transactions for testing purposes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {username}_transaction")
        conn.commit()
        conn.close()
        print(f"Cleared transactions for {username}")
    except Exception as e:
        print(f"Error clearing transactions: {e}")

def view_transactions(username):
    """View transactions for a user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {username}_transaction")
        transactions = cursor.fetchall()
        
        print(f"\n=== Transactions for {username} ===")
        if transactions:
            for idx, tx in enumerate(transactions):
                print(f"\nTransaction #{idx+1}:")
                print(f"Date/Time: {tx['timedate']}")
                print(f"Account: {tx['account_number']}")
                print(f"Type: {tx['transaction_type']}")
                print(f"Amount: {tx['amount']}")
                print(f"Donor ID: {tx['donor_id']}")
        else:
            print("No transactions found")
            
        conn.close()
    except Exception as e:
        print(f"Error viewing transactions: {e}")

def main():
    """Test fund transfer from Krish to Saibhagat"""
    print("=" * 60)
    print("TESTING FUND TRANSFER: KRISH -> SAIBHAGAT")
    print("=" * 60)
    
    # Get account info
    krish_info = get_account_info("Krish")
    saibhagat_info = get_account_info("saibhagat")
    
    if not krish_info:
        print("Krish account not found")
        return
        
    if not saibhagat_info:
        print("Saibhagat account not found")
        return
    
    print(f"Krish account: {krish_info['account']}, Balance: {krish_info['balance']}")
    print(f"Saibhagat account: {saibhagat_info['account']}, Balance: {saibhagat_info['balance']}")
    
    # Optional: Clear existing transactions for clean test
    should_clear = input("\nClear existing transactions for both users? (y/n): ").strip().lower()
    if should_clear == 'y':
        clear_transactions("Krish")
        clear_transactions("saibhagat")
    
    # Execute fund transfer
    transfer_amount = 100  # Small amount for testing
    donor_id = "website_transaction_id_12345"
    
    print(f"\nExecuting fund transfer: Krish -> Saibhagat ({saibhagat_info['account']})")
    print(f"Amount: {transfer_amount}")
    print(f"Donor ID: {donor_id}")
    
    krish_bank = Bank("Krish", krish_info['account'])
    krish_bank.fundtransfer(saibhagat_info['account'], transfer_amount, donor_id)
    
    # Show updated account info
    updated_krish_info = get_account_info("Krish")
    updated_saibhagat_info = get_account_info("saibhagat")
    
    print(f"\nUpdated balances:")
    if updated_krish_info:
        print(f"Krish balance: {updated_krish_info['balance']}")
    else:
        print("Could not retrieve updated Krish info")
        
    if updated_saibhagat_info:
        print(f"Saibhagat balance: {updated_saibhagat_info['balance']}")
    else:
        print("Could not retrieve updated Saibhagat info")
    
    # View transactions
    print("\nVerifying transaction records:")
    view_transactions("Krish")
    view_transactions("saibhagat")
    
    # Hash verification
    import hashlib
    print("\nHash verification:")
    original_hash = hashlib.sha256(donor_id.encode()).hexdigest()
    print(f"Original donor_id hash: {original_hash}")
    
    # Use the original account number we retrieved earlier
    sender_account_hash = hashlib.sha256(str(krish_info['account']).encode()).hexdigest()
    print(f"Krish account hash: {sender_account_hash}")
    
    print("\nVerify that:")
    print("1. Krish's transaction has the original donor_id hash")
    print("2. Saibhagat's transaction has Krish's account hash as donor_id")

if __name__ == "__main__":
    main()
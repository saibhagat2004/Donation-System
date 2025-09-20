#!/usr/bin/env python
"""
Test script to verify fund transfer with proper donor_id tracking
"""
import os
import sqlite3
import random
from bank import Bank

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def create_test_users():
    """Create test sender and receiver users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create sender
        sender_username = f"sender_{random.randint(1000, 9999)}"
        sender_account = random.randint(10000000, 99999999)
        
        cursor.execute("""
            INSERT INTO customers (username, password, name, age, city, balance, account_number, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (sender_username, "password123", "Sender User", 30, "Test City", 5000, sender_account, 1))
        
        # Create receiver
        receiver_username = f"receiver_{random.randint(1000, 9999)}"
        receiver_account = random.randint(10000000, 99999999)
        
        cursor.execute("""
            INSERT INTO customers (username, password, name, age, city, balance, account_number, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (receiver_username, "password123", "Receiver User", 30, "Test City", 1000, receiver_account, 1))
        
        conn.commit()
        conn.close()
        
        # Create transaction tables
        sender_bank = Bank(sender_username, sender_account)
        sender_bank.create_transaction_table()
        
        receiver_bank = Bank(receiver_username, receiver_account)
        receiver_bank.create_transaction_table()
        
        print(f"Created test users: {sender_username} (Account: {sender_account}) and {receiver_username} (Account: {receiver_account})")
        
        return {
            "sender_username": sender_username,
            "sender_account": sender_account,
            "receiver_username": receiver_username,
            "receiver_account": receiver_account
        }
        
    except Exception as e:
        print(f"Error creating test users: {e}")
        return None

def list_tables():
    """List all tables in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("\n=== All Tables in Database ===")
    for table in tables:
        print(f"- {table[0]}")
    conn.close()

def test_fund_transfer(sender_username, sender_account, receiver_account, donor_id):
    """Test fund transfer with donor_id tracking"""
    try:
        # List tables before transfer
        print("\nTables before fund transfer:")
        list_tables()
        
        # Execute fund transfer
        bank = Bank(sender_username, sender_account)
        print(f"\nExecuting fund transfer: {sender_username} -> {receiver_account}, amount: 1000")
        bank.fundtransfer(receiver_account, 1000, donor_id)
        
        # Check transaction records
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find receiver username
        cursor.execute("SELECT username FROM customers WHERE account_number = ?", (receiver_account,))
        receiver_row = cursor.fetchone()
        receiver_username = receiver_row['username'] if receiver_row else None
        
        # List tables after transfer
        print("\nTables after fund transfer:")
        list_tables()
        
        # Check tables exist
        print(f"\nChecking if transaction tables exist:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (f"{sender_username}_transaction",))
        sender_table = cursor.fetchone()
        print(f"Sender table '{sender_username}_transaction' exists: {sender_table is not None}")
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (f"{receiver_username}_transaction",))
        receiver_table = cursor.fetchone()
        print(f"Receiver table '{receiver_username}_transaction' exists: {receiver_table is not None}")
        
        # Check sender transaction
        print("\n== Checking Sender's Transaction Record ==")
        try:
            cursor.execute(f"SELECT * FROM {sender_username}_transaction")
            sender_txs = cursor.fetchall()
            print(f"Found {len(sender_txs)} transactions for sender")
            
            if sender_txs:
                for idx, tx in enumerate(sender_txs):
                    print(f"\nTransaction #{idx+1}:")
                    print(f"Date/Time: {tx['timedate']}")
                    print(f"Account: {tx['account_number']}")
                    print(f"Type: {tx['transaction_type']}")
                    print(f"Amount: {tx['amount']}")
                    print(f"Donor ID: {tx['donor_id']}")
            else:
                print("No transaction records found for sender")
        except Exception as e:
            print(f"Error querying sender transactions: {e}")
        
        # Check receiver transaction
        if receiver_username:
            print("\n== Checking Receiver's Transaction Record ==")
            try:
                cursor.execute(f"SELECT * FROM {receiver_username}_transaction")
                receiver_txs = cursor.fetchall()
                print(f"Found {len(receiver_txs)} transactions for receiver")
                
                if receiver_txs:
                    for idx, tx in enumerate(receiver_txs):
                        print(f"\nTransaction #{idx+1}:")
                        print(f"Date/Time: {tx['timedate']}")
                        print(f"Account: {tx['account_number']}")
                        print(f"Type: {tx['transaction_type']}")
                        print(f"Amount: {tx['amount']}")
                        print(f"Donor ID: {tx['donor_id']}")
                else:
                    print("No transaction records found for receiver")
            except Exception as e:
                print(f"Error querying receiver transactions: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error during fund transfer test: {e}")

def main():
    """Main function"""
    print("=" * 60)
    print("FUND TRANSFER WITH DONOR ID TEST")
    print("=" * 60)
    
    # Create test users
    users = create_test_users()
    if not users:
        print("Failed to create test users. Exiting.")
        return
    
    print("\nStep 1: Testing Fund Transfer with Test Donor ID")
    test_donor_id = "website_object_123456789"
    print(f"Using donor ID: {test_donor_id}")
    
    # Execute test
    test_fund_transfer(
        users["sender_username"],
        users["sender_account"],
        users["receiver_account"],
        test_donor_id
    )
    
    print("\nStep 2: Verifying Values (No Hashing)")
    
    # Verify sender's transaction should have the original donor_id directly
    print(f"Original donor_id: {test_donor_id}")
    
    # Verify receiver's transaction should have sender's account number directly
    sender_account_str = str(users["sender_account"])
    print(f"Sender account: {sender_account_str}")
    
    print("\nTest complete. Compare these values with the transaction records above.")

if __name__ == "__main__":
    main()
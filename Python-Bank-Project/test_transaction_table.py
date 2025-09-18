#!/usr/bin/env python
"""
Test script to verify transaction table creation
"""
import os
import sqlite3
from bank import Bank

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def list_all_tables():
    """List all tables in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get list of all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in the database.")
            return []
        
        print("\n=== Tables in the Database ===")
        table_list = []
        for table in tables:
            table_name = table[0]
            table_list.append(table_name)
            print(f"- {table_name}")
            
            # Get table schema for each table
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("  Columns:")
            for col in columns:
                print(f"    - {col[1]} ({col[2]})")
            print()
            
        print(f"Total tables: {len(tables)}\n")
        return table_list
        
    except Exception as e:
        print(f"Error listing tables: {e}")
        return []
    finally:
        conn.close()

def create_test_user():
    """Create a test user and transaction table"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if test user exists
        test_username = "testuser123"
        test_account = 12345678
        
        cursor.execute("SELECT username FROM customers WHERE username = ?", (test_username,))
        if cursor.fetchone():
            print(f"Test user '{test_username}' already exists.")
        else:
            # Create test user
            cursor.execute("""
                INSERT INTO customers (username, password, name, age, city, balance, account_number, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (test_username, "password123", "Test User", 30, "Test City", 1000, test_account, 1))
            conn.commit()
            print(f"Created test user: {test_username}")
        
        conn.close()
        
        # Create transaction table using Bank class
        bank = Bank(test_username, test_account)
        bank.create_transaction_table()
        print(f"Attempted to create transaction table for {test_username}")
        
        # Make a test deposit
        bank.deposit(100, "test_donor")
        print(f"Made test deposit to {test_username}")
        
        # Verify transaction table exists and has correct schema
        list_all_tables()
        
        return test_username
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        return None

def main():
    """Main function"""
    print("=" * 60)
    print("TRANSACTION TABLE CREATION TEST")
    print("=" * 60)
    
    print("\nStep 1: Listing existing tables")
    list_all_tables()
    
    print("\nStep 2: Creating test user and transaction table")
    create_test_user()
    
    print("\nStep 3: Verifying transaction table was created")
    list_all_tables()

if __name__ == "__main__":
    main()
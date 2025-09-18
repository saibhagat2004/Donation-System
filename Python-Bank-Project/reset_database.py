#!/usr/bin/env python
"""
Database Reset Script for Python Banking System

This script creates a new database with the proper schema for the customers table.
If the original database is locked, it creates a new one with a different name.
"""

import os
import sqlite3
import time
from datetime import datetime

def reset_database():
    # Define database path
    original_db_path = "bank.db"
    
    print("Resetting database...")
    
    # Try to use the original name, but if it's locked, create a new file
    db_path = original_db_path
    
    # Check if database file exists and try to delete it
    if os.path.exists(original_db_path):
        try:
            os.remove(original_db_path)
            print(f"Existing database '{original_db_path}' has been deleted.")
        except Exception as e:
            print(f"Warning: Could not delete existing database: {e}")
            print("Creating a new database file instead.")
            # Create new filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            db_path = f"bank_{timestamp}.db"
            print(f"New database will be created as: {db_path}")
    else:
        print("No existing database found.")
    
    # Create a new empty database with just the customers table
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create the customers table with the proper schema
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            city TEXT NOT NULL,
            balance INTEGER NOT NULL,
            account_number INTEGER NOT NULL,
            status INTEGER NOT NULL
        )
        """)
        
        conn.commit()
        conn.close()
        print(f"New database '{db_path}' has been created with customers table.")
        print("\nSystem is ready for new user signups.")
        print("Transaction tables will be created automatically when users sign up.")
        return True
    except Exception as e:
        print(f"Error creating new database: {e}")
        return False

if __name__ == "__main__":
    reset_database()
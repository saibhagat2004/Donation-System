#!/usr/bin/env python
"""
User Deletion Script for Python Banking System

This script provides functionality to clean up the database by:
1. Listing all users in the system
2. Deleting a specific user by username
3. Deleting multiple users by providing a list
4. Deleting all users (with confirmation)

Use with caution - all operations are irreversible!
"""

import sqlite3
import os
from bank import Bank

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def list_all_users():
    """List all users in the database with their account details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT username, name, account_number, balance FROM customers")
        users = cursor.fetchall()
        
        if not users:
            print("No users found in the database.")
            return []
        
        print("\n=== Current Users in the System ===")
        print(f"{'Username':<15} {'Name':<20} {'Account Number':<15} {'Balance':<10}")
        print("-" * 60)
        
        user_list = []
        for user in users:
            print(f"{user['username']:<15} {user['name']:<20} {user['account_number']:<15} {user['balance']:<10}")
            user_list.append(user['username'])
            
        print("-" * 60)
        print(f"Total users: {len(users)}\n")
        return user_list
        
    except Exception as e:
        print(f"Error listing users: {e}")
        return []
    finally:
        conn.close()

def delete_specific_user(username):
    """Delete a specific user by username"""
    if not username:
        print("Error: No username provided")
        return False
    
    print(f"\nAttempting to delete user: {username}")
    confirmation = input(f"Are you sure you want to delete user '{username}'? This action cannot be undone! (type 'yes' to confirm): ")
    
    if confirmation.lower() != "yes":
        print("Deletion cancelled.")
        return False
    
    result = Bank.delete_user(username)
    return result

def delete_users_from_list(usernames):
    """Delete multiple users from a list"""
    if not usernames:
        print("No usernames provided for deletion")
        return
    
    print(f"\nPreparing to delete {len(usernames)} users:")
    for username in usernames:
        print(f"- {username}")
    
    confirmation = input(f"Are you sure you want to delete these {len(usernames)} users? This action cannot be undone! (type 'yes' to confirm): ")
    
    if confirmation.lower() != "yes":
        print("Batch deletion cancelled.")
        return
    
    success_count = 0
    failed_count = 0
    
    for username in usernames:
        print(f"\nProcessing deletion for: {username}")
        if Bank.delete_user(username):
            success_count += 1
        else:
            failed_count += 1
    
    print(f"\nDeletion complete. Successfully deleted: {success_count}, Failed: {failed_count}")

def delete_all_users():
    """Delete all users from the database (with confirmation)"""
    users = list_all_users()
    
    if not users:
        print("No users to delete.")
        return
    
    print("\n!!! DANGER: You are about to delete ALL USERS !!!")
    confirmation1 = input(f"Are you sure you want to delete all {len(users)} users? This will erase all accounts and transactions! (type 'DELETE ALL USERS' to confirm): ")
    
    if confirmation1 != "DELETE ALL USERS":
        print("Deletion cancelled.")
        return
    
    confirmation2 = input("This is your last warning! Type 'CONFIRM' to proceed with deletion of all user data: ")
    
    if confirmation2 != "CONFIRM":
        print("Deletion cancelled.")
        return
    
    print("\nProceeding with deletion of all users...")
    delete_users_from_list(users)
    
    # Verify deletion
    remaining = list_all_users()
    if not remaining:
        print("All users have been successfully removed from the system.")
    else:
        print(f"Warning: {len(remaining)} users remain in the system.")

def main():
    """Main function to run the deletion script interactively"""
    print("=" * 60)
    print("PYTHON BANKING SYSTEM - USER DELETION UTILITY")
    print("=" * 60)
    print("WARNING: This utility will permanently delete user data!")
    print("=" * 60)
    
    while True:
        print("\nOptions:")
        print("1. List all users")
        print("2. Delete a specific user")
        print("3. Delete multiple users")
        print("4. Delete ALL users")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == '1':
            list_all_users()
        
        elif choice == '2':
            username = input("\nEnter the username to delete: ")
            delete_specific_user(username)
        
        elif choice == '3':
            print("\nEnter usernames to delete (one per line)")
            print("Enter a blank line when finished")
            
            usernames = []
            while True:
                username = input("> ")
                if not username:
                    break
                usernames.append(username)
            
            if usernames:
                delete_users_from_list(usernames)
            else:
                print("No usernames provided.")
        
        elif choice == '4':
            delete_all_users()
        
        elif choice == '5':
            print("\nExiting user deletion utility.")
            break
        
        else:
            print("\nInvalid choice. Please select a valid option (1-5).")

if __name__ == "__main__":
    main()
# Bank Services
from database import *
import datetime
import hashlib


class Bank:
    def __init__(self, username, account_number):
        self.__username = username
        self.__account_number = account_number
        
    def prepare_donor_id(self, data):
        """Prepare donor_id for storage (no hashing)"""
        if data is None:
            return None
        return str(data)

    def create_transaction_table(self):
        db_query(f"CREATE TABLE IF NOT EXISTS {self.__username}_transaction "
                 f"( timedate VARCHAR(30),"
                 f"account_number INTEGER,"
                 f"transaction_type VARCHAR(30),"
                 f"amount INTEGER,"
                 f"donor_id VARCHAR(64) )")

    def balanceequiry(self):
        temp = db_query(
            f"SELECT balance FROM customers WHERE username = '{self.__username}';")
        print(f"{self.__username} Balance is {temp[0][0]}")

    def deposit(self, amount, donor_id=None):
        temp = db_query(
            f"SELECT balance FROM customers WHERE username = '{self.__username}';")
        test = amount + temp[0][0]
        db_query(
            f"UPDATE customers SET balance = '{test}' WHERE username = '{self.__username}'; ")
        self.balanceequiry()
        donor_id_value = self.prepare_donor_id(donor_id)
        db_query(f"INSERT INTO {self.__username}_transaction VALUES ("
                 f"'{datetime.datetime.now()}',"
                 f"'{self.__account_number}',"
                 f"'Amount Deposit',"
                 f"'{amount}',"
                 f"'{donor_id_value}'"
                 f")")
        print(f"{self.__username} Amount is Sucessfully Depositted into Your Account {self.__account_number}")

    def withdraw(self, amount, donor_id=None):
        temp = db_query(
            f"SELECT balance FROM customers WHERE username = '{self.__username}';")
        if amount > temp[0][0]:
            print("Insufficient Balance Please Deposit Money")
        else:
            test = temp[0][0] - amount
            db_query(
                f"UPDATE customers SET balance = '{test}' WHERE username = '{self.__username}'; ")
            self.balanceequiry()
            donor_id_value = self.prepare_donor_id(donor_id)
            db_query(f"INSERT INTO {self.__username}_transaction VALUES ("
                     f"'{datetime.datetime.now()}',"
                     f"'{self.__account_number}',"
                     f"'Amount Withdraw',"
                     f"'{amount}',"
                     f"'{donor_id_value}'"
                     f")")
            print(
                f"{self.__username} Amount is Sucessfully Withdraw from Your Account {self.__account_number}")

    def fundtransfer(self, receive, amount, donor_id=None):
        temp = db_query(
            f"SELECT balance FROM customers WHERE username = '{self.__username}';")
        if amount > temp[0][0]:
            print("Insufficient Balance Please Deposit Money")
        else:
            temp2 = db_query(
                f"SELECT balance FROM customers WHERE account_number = '{receive}';")
            if temp2 == []:
                print("Account Number Does not Exists")
            else:
                test1 = temp[0][0] - amount
                test2 = amount + temp2[0][0]
                db_query(
                    f"UPDATE customers SET balance = '{test1}' WHERE username = '{self.__username}'; ")
                db_query(
                    f"UPDATE customers SET balance = '{test2}' WHERE account_number = '{receive}'; ")
                receiver_username = db_query(
                    f"SELECT username FROM customers where account_number = '{receive}';")
                self.balanceequiry()
                
                # Process donor_id for sender's transaction record
                # Original donor_id passed through if provided, or None if not provided
                sender_donor_id = self.prepare_donor_id(donor_id)
                
                # For receiver's transaction, the sender's account number is the donor
                # This ensures the recipient knows who sent the money
                receiver_donor_id = self.prepare_donor_id(self.__account_number)
                
                # Receiver's transaction record
                db_query(f"INSERT INTO {receiver_username[0][0]}_transaction VALUES ("
                         f"'{datetime.datetime.now()}',"
                         f"'{self.__account_number}',"
                         f"'Fund Transfer From {self.__account_number}',"
                         f"'{amount}',"
                         f"'{receiver_donor_id}'"  # Use sender's account as donor_id for receiver
                         f")")
                         
                # Sender's transaction record
                db_query(f"INSERT INTO {self.__username}_transaction VALUES ("
                         f"'{datetime.datetime.now()}',"
                         f"'{self.__account_number}',"
                         f"'Fund Transfer -> {receive}',"
                         f"'{amount}',"
                         f"'{sender_donor_id}'"  # Use original donor_id for sender's record
                         f")")
                print(
                    f"{self.__username} Amount is Sucessfully Transaction from Your Account {self.__account_number}")
                    
    def delete_transaction_table(self):
        """Delete the transaction table for this user"""
        try:
            # Check if the table exists first
            table_exists = db_query(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{self.__username}_transaction'")
            if table_exists:
                db_query(f"DROP TABLE IF EXISTS {self.__username}_transaction")
                print(f"Transaction table for {self.__username} has been deleted")
                return True
            else:
                print(f"No transaction table found for {self.__username}")
                return False
        except Exception as e:
            print(f"Error deleting transaction table: {e}")
            return False
    
    @staticmethod
    def delete_user(username):
        """Delete a user from the customers table and their transaction table"""
        try:
            # First check if the user exists
            user_exists = db_query(f"SELECT username FROM customers WHERE username = '{username}'")
            if not user_exists:
                print(f"User {username} does not exist")
                return False
                
            # Get account number for logging
            account_info = db_query(f"SELECT account_number FROM customers WHERE username = '{username}'")
            account_number = account_info[0][0] if account_info else "Unknown"
            
            # Delete transaction table first
            bank = Bank(username, account_number)
            bank.delete_transaction_table()
            
            # Then delete the user from customers table
            db_query(f"DELETE FROM customers WHERE username = '{username}'")
            print(f"User {username} (Account: {account_number}) has been deleted from the system")
            return True
            
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

#Database Management Banking - SQLite Version
import sqlite3
import os

# Create database file in the project directory
db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
mydb = sqlite3.connect(db_path)
cursor = mydb.cursor()

def db_query(str):
    cursor.execute(str)
    result = cursor.fetchall()
    return result

def createcustomertable():
    cursor.execute('''
                CREATE TABLE IF NOT EXISTS customers
                (username TEXT NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                city TEXT NOT NULL,
                balance INTEGER NOT NULL,
                account_number INTEGER NOT NULL,
                status INTEGER NOT NULL)
    ''')
    mydb.commit()

if __name__ == "__main__":
    createcustomertable()
    print("Database tables created successfully!")

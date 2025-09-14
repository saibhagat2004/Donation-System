from flask import Flask, jsonify, request, render_template_string, send_from_directory
from flask_cors import CORS
import os
import sqlite3
from customer import Customer
from bank import Bank
from register import SignUp, SignIn
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Database setup
def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'bank.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with the customers table"""
    conn = get_db_connection()
    cursor = conn.cursor()
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
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# API Routes
@app.route('/api/signup', methods=['POST'])
def api_signup():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        age = int(data.get('age'))
        city = data.get('city')

        # Validate input
        if not all([username, password, name, age, city]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400

        if age < 18:
            return jsonify({'success': False, 'message': 'You must be at least 18 years old'}), 400

        # Check if username already exists
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM customers WHERE username = ?", (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Username already exists'}), 400

        # Generate unique account number
        while True:
            account_number = random.randint(10000000, 99999999)
            cursor.execute("SELECT account_number FROM customers WHERE account_number = ?", (account_number,))
            if not cursor.fetchone():
                break

        # Create customer
        cursor.execute("""
            INSERT INTO customers (username, password, name, age, city, balance, account_number, status)
            VALUES (?, ?, ?, ?, ?, 0, ?, 1)
        """, (username, password, name, age, city, account_number))
        
        # Create transaction table for user
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {username}_transaction (
                timedate VARCHAR(30),
                account_number INTEGER,
                remarks VARCHAR(30),
                amount INTEGER
            )
        """)
        
        conn.commit()
        conn.close()

        return jsonify({
            'success': True, 
            'message': f'Account created successfully! Your account number is: {account_number}',
            'account_number': account_number
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/signin', methods=['POST'])
def api_signin():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if not all([username, password]):
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'success': False, 'message': 'Username not found'}), 401

        if user['password'] != password:
            return jsonify({'success': False, 'message': 'Wrong password'}), 401

        return jsonify({
            'success': True,
            'message': f'Welcome back, {user["name"]}!',
            'user': {
                'username': user['username'],
                'name': user['name'],
                'account_number': user['account_number'],
                'balance': user['balance'],
                'age': user['age'],
                'city': user['city']
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/balance', methods=['POST'])
def api_balance():
    try:
        data = request.json
        username = data.get('username')

        if not username:
            return jsonify({'success': False, 'message': 'Username is required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM customers WHERE username = ?", (username,))
        result = cursor.fetchone()
        conn.close()

        if not result:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        return jsonify({
            'success': True,
            'balance': result['balance']
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/deposit', methods=['POST'])
def api_deposit():
    try:
        data = request.json
        username = data.get('username')
        amount = int(data.get('amount'))
        account_number = data.get('account_number')

        if not all([username, amount, account_number]) or amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid input data'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current balance
        cursor.execute("SELECT balance FROM customers WHERE username = ?", (username,))
        current_balance = cursor.fetchone()['balance']
        
        # Update balance
        new_balance = current_balance + amount
        cursor.execute("UPDATE customers SET balance = ? WHERE username = ?", (new_balance, username))
        
        # Add transaction record
        from datetime import datetime
        cursor.execute(f"""
            INSERT INTO {username}_transaction (timedate, account_number, remarks, amount)
            VALUES (?, ?, 'Amount Deposit', ?)
        """, (str(datetime.now()), account_number, amount))
        
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'₹{amount} deposited successfully!',
            'new_balance': new_balance
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/withdraw', methods=['POST'])
def api_withdraw():
    try:
        data = request.json
        username = data.get('username')
        amount = int(data.get('amount'))
        account_number = data.get('account_number')

        if not all([username, amount, account_number]) or amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid input data'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current balance
        cursor.execute("SELECT balance FROM customers WHERE username = ?", (username,))
        current_balance = cursor.fetchone()['balance']
        
        if amount > current_balance:
            conn.close()
            return jsonify({'success': False, 'message': 'Insufficient balance'}), 400
        
        # Update balance
        new_balance = current_balance - amount
        cursor.execute("UPDATE customers SET balance = ? WHERE username = ?", (new_balance, username))
        
        # Add transaction record
        from datetime import datetime
        cursor.execute(f"""
            INSERT INTO {username}_transaction (timedate, account_number, remarks, amount)
            VALUES (?, ?, 'Amount Withdrawal', ?)
        """, (str(datetime.now()), account_number, amount))
        
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'₹{amount} withdrawn successfully!',
            'new_balance': new_balance
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transfer', methods=['POST'])
def api_transfer():
    try:
        data = request.json
        sender_username = data.get('username')
        receiver_account = int(data.get('receiver_account'))
        amount = int(data.get('amount'))
        sender_account = data.get('account_number')

        if not all([sender_username, receiver_account, amount, sender_account]) or amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid input data'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get sender's current balance
        cursor.execute("SELECT balance FROM customers WHERE username = ?", (sender_username,))
        sender_data = cursor.fetchone()
        if not sender_data:
            conn.close()
            return jsonify({'success': False, 'message': 'Sender not found'}), 404
            
        sender_balance = sender_data['balance']
        
        if amount > sender_balance:
            conn.close()
            return jsonify({'success': False, 'message': 'Insufficient balance'}), 400
        
        # Check if receiver exists
        cursor.execute("SELECT username, balance FROM customers WHERE account_number = ?", (receiver_account,))
        receiver_data = cursor.fetchone()
        if not receiver_data:
            conn.close()
            return jsonify({'success': False, 'message': 'Receiver account not found'}), 404
        
        if receiver_account == int(sender_account):
            conn.close()
            return jsonify({'success': False, 'message': 'Cannot transfer to your own account'}), 400
        
        receiver_username = receiver_data['username']
        receiver_balance = receiver_data['balance']
        
        # Update balances
        new_sender_balance = sender_balance - amount
        new_receiver_balance = receiver_balance + amount
        
        cursor.execute("UPDATE customers SET balance = ? WHERE username = ?", (new_sender_balance, sender_username))
        cursor.execute("UPDATE customers SET balance = ? WHERE username = ?", (new_receiver_balance, receiver_username))
        
        # Add transaction records
        from datetime import datetime
        current_time = str(datetime.now())
        
        # Sender transaction
        cursor.execute(f"""
            INSERT INTO {sender_username}_transaction (timedate, account_number, remarks, amount)
            VALUES (?, ?, 'Fund Transfer Out', ?)
        """, (current_time, sender_account, amount))
        
        # Receiver transaction
        cursor.execute(f"""
            INSERT INTO {receiver_username}_transaction (timedate, account_number, remarks, amount)
            VALUES (?, ?, 'Fund Transfer In', ?)
        """, (current_time, receiver_account, amount))
        
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'₹{amount} transferred successfully to account {receiver_account}!',
            'new_balance': new_sender_balance
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def api_transactions():
    try:
        data = request.json
        username = data.get('username')

        if not username:
            return jsonify({'success': False, 'message': 'Username is required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(f"SELECT * FROM {username}_transaction ORDER BY timedate DESC LIMIT 10")
            transactions = cursor.fetchall()
            
            transaction_list = []
            for trans in transactions:
                transaction_list.append({
                    'timedate': trans['timedate'],
                    'account_number': trans['account_number'],
                    'remarks': trans['remarks'],
                    'amount': trans['amount']
                })
            
            conn.close()
            return jsonify({
                'success': True,
                'transactions': transaction_list
            })
        except sqlite3.OperationalError:
            # Table doesn't exist yet
            conn.close()
            return jsonify({
                'success': True,
                'transactions': []
            })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    print("Starting Banking Simulation Server...")
    print("Access the application at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

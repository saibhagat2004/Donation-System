from flask import Flask, jsonify, request, render_template_string, send_from_directory, make_response
from flask_cors import CORS
import os
import sqlite3
import hashlib
import io
import csv
from datetime import datetime
from customer import Customer
from bank import Bank
from register import SignUp, SignIn
from blockchain_integration import blockchain
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

# Migrate existing transaction tables to include cause column
def migrate_transaction_tables():
    """Add cause column to existing transaction tables"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all existing users
        cursor.execute("SELECT username FROM customers")
        users = cursor.fetchall()
        
        for user in users:
            username = user['username']
            table_name = f"{username}_transaction"
            
            try:
                # Check if table exists and if cause column exists
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = [column[1] for column in cursor.fetchall()]
                
                if 'cause' not in columns and len(columns) > 0:
                    # Add cause column to existing table
                    cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN cause VARCHAR(50)")
                    print(f"✅ Added cause column to {table_name}")
                    
            except sqlite3.OperationalError as e:
                # Table might not exist yet, which is fine
                print(f"⚠️ Could not migrate {table_name}: {e}")
                continue
        
        conn.commit()
        conn.close()
        print("🎉 Transaction table migration completed!")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")

# Initialize database on startup
init_db()
migrate_transaction_tables()

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
                
        # Hash the password before storing it
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Create customer
        cursor.execute("""
            INSERT INTO customers (username, password, name, age, city, balance, account_number, status)
            VALUES (?, ?, ?, ?, ?, 0, ?, 1)
        """, (username, hashed_password, name, age, city, account_number))
        
        # Create transaction table for user
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {username}_transaction (
                timedate VARCHAR(30),
                account_number INTEGER,
                transaction_type VARCHAR(30),
                amount INTEGER,
                donor_id VARCHAR(64),
                cause VARCHAR(50)
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

        # Hash the provided password and compare with stored hash
        hashed_input_password = hashlib.sha256(password.encode()).hexdigest()
        
        if user['password'] != hashed_input_password:
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
        donor_id = data.get('donor_id')  # Parameter for donor_id
        cause = data.get('cause')  # New parameter for donation cause (education, health, etc.)

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
        
        # Store donor_id directly without hashing
        donor_id_value = None
        if donor_id:
            donor_id_value = str(donor_id)  # Convert to string if it's not already
        
        # Add transaction record
        from datetime import datetime
        cursor.execute(f"""
            INSERT INTO {username}_transaction (timedate, account_number, transaction_type, amount, donor_id, cause)
            VALUES (?, ?, 'Amount Deposit', ?, ?, ?)
        """, (str(datetime.now()), account_number, amount, donor_id_value, cause))
        
        conn.commit()
        conn.close()

        # 🔗 BLOCKCHAIN INTEGRATION: Record deposit on blockchain
        blockchain_result = None
        blockchain_tx_hash = None
        blockchain_tx_id = None
        
        try:
            blockchain_result = blockchain.record_donation_on_blockchain(
                ngo_account=account_number,
                donor_id=donor_id_value or f"deposit_{account_number}",
                cause=cause or "Cash Deposit",
                amount=amount
            )
            
            if blockchain_result and blockchain_result['success']:
                blockchain_tx_hash = blockchain_result.get('tx_hash')
                blockchain_tx_id = blockchain_result.get('blockchain_tx_id')
                print(f"✅ Deposit recorded on blockchain: {blockchain_tx_hash}")
            else:
                print(f"⚠️ Blockchain recording failed for deposit: {blockchain_result.get('error') if blockchain_result else 'Unknown error'}")
                
        except Exception as blockchain_error:
            print(f"❌ Blockchain error during deposit: {blockchain_error}")
            blockchain_result = {
                'success': False,
                'error': str(blockchain_error)
            }

        return jsonify({
            'success': True,
            'message': f'₹{amount} deposited successfully!',
            'new_balance': new_balance,
            'blockchain': {
                'recorded': blockchain_result['success'] if blockchain_result else False,
                'tx_hash': blockchain_tx_hash,
                'blockchain_tx_id': blockchain_tx_id,
                'error': blockchain_result.get('error') if blockchain_result and not blockchain_result['success'] else None
            }
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
        donor_id = data.get('donor_id')  # Parameter for donor_id
        cause = data.get('cause')  # New parameter for donation cause

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
        
        # Store donor_id directly without hashing
        donor_id_value = None
        if donor_id:
            donor_id_value = str(donor_id)  # Convert to string if it's not already
            
        # Add transaction record
        from datetime import datetime
        cursor.execute(f"""
            INSERT INTO {username}_transaction (timedate, account_number, transaction_type, amount, donor_id, cause)
            VALUES (?, ?, 'Amount Withdraw', ?, ?, ?)
        """, (str(datetime.now()), account_number, amount, donor_id_value, cause))
        
        conn.commit()
        conn.close()

        # 🔗 BLOCKCHAIN INTEGRATION: Record withdrawal on blockchain
        blockchain_result = None
        blockchain_tx_hash = None
        blockchain_tx_id = None
        
        try:
            # For withdrawals, we record as spending from the NGO account
            blockchain_result = blockchain.record_spending_on_blockchain(
                ngo_account=account_number,
                receiver_id=donor_id_value or f"cash_withdrawal_{username}",
                cause=cause or "Cash Withdrawal", 
                amount=amount
            )
            
            if blockchain_result and blockchain_result['success']:
                blockchain_tx_hash = blockchain_result.get('tx_hash')
                blockchain_tx_id = blockchain_result.get('blockchain_tx_id')
                print(f"✅ Withdrawal recorded on blockchain: {blockchain_tx_hash}")
            else:
                print(f"⚠️ Blockchain recording failed for withdrawal: {blockchain_result.get('error') if blockchain_result else 'Unknown error'}")
                
        except Exception as blockchain_error:
            print(f"❌ Blockchain error during withdrawal: {blockchain_error}")
            blockchain_result = {
                'success': False,
                'error': str(blockchain_error)
            }

        return jsonify({
            'success': True,
            'message': f'₹{amount} withdrawn successfully!',
            'new_balance': new_balance,
            'blockchain': {
                'recorded': blockchain_result['success'] if blockchain_result else False,
                'tx_hash': blockchain_tx_hash,
                'blockchain_tx_id': blockchain_tx_id,
                'error': blockchain_result.get('error') if blockchain_result and not blockchain_result['success'] else None
            }
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
        donor_id = data.get('donor_id')  # Parameter for donor_id
        cause = data.get('cause')  # New parameter for donation cause

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
        
        # Process donor IDs for sender and receiver
        sender_donor_id = None
        receiver_donor_id = None
        
        # For sender's transaction, use the original donor_id if provided
        if donor_id:
            sender_donor_id = str(donor_id)
        
        # For receiver's transaction, use the sender's account number as the donor
        # This ensures the recipient knows who sent the money
        receiver_donor_id = str(sender_account)
            
        # Add transaction records
        from datetime import datetime
        current_time = str(datetime.now())
        
        # Sender transaction
        cursor.execute(f"""
            INSERT INTO {sender_username}_transaction (timedate, account_number, transaction_type, amount, donor_id, cause)
            VALUES (?, ?, 'Fund Transfer -> {receiver_account}', ?, ?, ?)
        """, (current_time, sender_account, amount, sender_donor_id, cause))
        
        # Receiver transaction
        cursor.execute(f"""
            INSERT INTO {receiver_username}_transaction (timedate, account_number, transaction_type, amount, donor_id, cause)
            VALUES (?, ?, 'Fund Transfer From {sender_account}', ?, ?, ?)
        """, (current_time, receiver_account, amount, receiver_donor_id, cause))
        
        conn.commit()
        conn.close()

        # 🔗 BLOCKCHAIN INTEGRATION: Record transfer on blockchain
        blockchain_result = None
        blockchain_tx_hash = None
        blockchain_tx_id = None
        
        try:
            # Record the transfer: spending from sender, donation to receiver
            # First, record as spending from sender's account
            print(f"🔗 Recording spending from sender account: NGO_{sender_account}")
            spending_result = blockchain.record_spending_on_blockchain(
                ngo_account=sender_account,
                receiver_id=f"transfer_to_{receiver_account}",
                cause=cause or "Fund Transfer (Outgoing)",
                amount=amount
            )
            
            # Then, record as donation to receiver's account 
            print(f"🔗 Recording donation to receiver account: NGO_{receiver_account}")
            donation_result = blockchain.record_donation_on_blockchain(
                ngo_account=receiver_account,
                donor_id=sender_donor_id or f"transfer_from_{sender_account}",
                cause=cause or "Fund Transfer (Incoming)",
                amount=amount
            )
            
            # Create combined result showing both transactions
            blockchain_result = {
                'success': spending_result.get('success', False) and donation_result.get('success', False),
                'spending': {
                    'tx_hash': spending_result.get('tx_hash'),
                    'blockchain_tx_id': spending_result.get('blockchain_tx_id'),
                    'success': spending_result.get('success', False)
                },
                'donation': {
                    'tx_hash': donation_result.get('tx_hash'),
                    'blockchain_tx_id': donation_result.get('blockchain_tx_id'),
                    'success': donation_result.get('success', False)
                },
                'tx_hash': donation_result.get('tx_hash'),  # Primary TX hash for compatibility
                'blockchain_tx_id': donation_result.get('blockchain_tx_id'),  # Primary TX ID
                'error': spending_result.get('error') or donation_result.get('error')
            }
            
            print(f"✅ Transfer recorded:")
            print(f"   Spending TX: {spending_result.get('tx_hash', 'FAILED')} (ID: {spending_result.get('blockchain_tx_id', 'N/A')})")
            print(f"   Donation TX: {donation_result.get('tx_hash', 'FAILED')} (ID: {donation_result.get('blockchain_tx_id', 'N/A')})")
            
        except Exception as blockchain_error:
            print(f"❌ Blockchain error during transfer: {blockchain_error}")
            blockchain_result = {
                'success': False,
                'error': str(blockchain_error)
            }
            
        if blockchain_result and blockchain_result['success']:
            blockchain_tx_hash = blockchain_result.get('tx_hash')
            blockchain_tx_id = blockchain_result.get('blockchain_tx_id')
            print(f"✅ Transfer recorded on blockchain: {blockchain_tx_hash}")
        else:
            print(f"⚠️ Blockchain recording failed for transfer: {blockchain_result.get('error') if blockchain_result else 'Unknown error'}")

        return jsonify({
            'success': True,
            'message': f'₹{amount} transferred successfully to account {receiver_account}!',
            'new_balance': new_sender_balance,
            'blockchain': {
                'recorded': blockchain_result['success'] if blockchain_result else False,
                'tx_hash': blockchain_tx_hash,
                'blockchain_tx_id': blockchain_tx_id,
                'spending_tx': blockchain_result.get('spending', {}) if blockchain_result else {},
                'donation_tx': blockchain_result.get('donation', {}) if blockchain_result else {},
                'error': blockchain_result.get('error') if blockchain_result and not blockchain_result['success'] else None
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/add_money', methods=['POST'])
def api_add_money():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No JSON data provided'}), 400
            
        account_number = data.get('account_number')
        amount = data.get('amount')
        donor_id = data.get('donor_id')  # Parameter for donor_id
        cause = data.get('cause')  # New parameter for donation cause

        if not account_number or not amount:
            return jsonify({'success': False, 'message': 'Account number and amount are required'}), 400

        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be greater than zero'}), 400

        # Find user by account number
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username, balance FROM customers WHERE account_number = ?", (account_number,))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'Account not found'}), 404

        username = user['username']
        current_balance = user['balance']
        
        # Update balance
        new_balance = current_balance + amount
        cursor.execute("UPDATE customers SET balance = ? WHERE username = ?", (new_balance, username))
        
        # Store donor_id directly without hashing
        donor_id_value = None
        if donor_id:
            donor_id_value = str(donor_id)  # Convert to string if it's not already
        
        # Add transaction record
        from datetime import datetime
        cursor.execute(f"""
            INSERT INTO {username}_transaction (timedate, account_number, transaction_type, amount, donor_id, cause)
            VALUES (?, ?, 'Donation Received', ?, ?, ?)
        """, (str(datetime.now()), account_number, amount, donor_id_value, cause))
        
        conn.commit()
        conn.close()

        # 🔗 BLOCKCHAIN INTEGRATION: Record donation on blockchain
        blockchain_result = None
        blockchain_tx_hash = None
        blockchain_tx_id = None
        
        try:
            print(f"🔗 Recording donation on blockchain: ₹{amount} to account {account_number}")
            
            # Record donation on blockchain smart contract
            blockchain_result = blockchain.record_donation_on_blockchain(
                ngo_account=str(account_number),
                donor_id=donor_id_value or "ANONYMOUS",
                cause=cause or "general",
                amount=amount
            )
            
            if blockchain_result['success']:
                blockchain_tx_hash = blockchain_result['tx_hash']
                blockchain_tx_id = blockchain_result['blockchain_tx_id']
                print(f"✅ Blockchain recording successful: {blockchain_tx_hash}")
            else:
                print(f"⚠️ Blockchain recording failed: {blockchain_result['error']}")
                
        except Exception as blockchain_error:
            print(f"❌ Blockchain integration error: {blockchain_error}")
            # Don't fail the entire operation if blockchain fails
            blockchain_result = {
                'success': False,
                'error': str(blockchain_error)
            }

        return jsonify({
            'success': True,
            'message': f'₹{amount} added successfully to account {account_number}!',
            'new_balance': new_balance,
            'blockchain': {
                'recorded': blockchain_result['success'] if blockchain_result else False,
                'tx_hash': blockchain_tx_hash,
                'blockchain_tx_id': blockchain_tx_id,
                'error': blockchain_result.get('error') if blockchain_result and not blockchain_result['success'] else None
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def api_transactions():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No JSON data provided'}), 400
            
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
                    'transaction_type': trans['transaction_type'],  # Updated from 'remarks'
                    'amount': trans['amount'],
                    'donor_id': trans['donor_id'],  # Added donor_id to response
                    'cause': trans['cause'] if 'cause' in trans.keys() else None,  # Add cause to response
                    'transaction_direction': 'credit' if 'Deposit' in trans['transaction_type'] or 'From' in trans['transaction_type'] or 'Received' in trans['transaction_type'] else 'debit'
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

@app.route('/api/epassbook', methods=['POST'])
def api_epassbook():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No JSON data provided'}), 400
            
        username = data.get('username')
        if not username:
            return jsonify({'success': False, 'message': 'Username is required'}), 400
            
        # Optional parameters for filtering and pagination
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        transaction_type = data.get('transaction_type')  # Can be 'deposit', 'withdraw', 'transfer' or None for all
        page = int(data.get('page', 1))
        per_page = int(data.get('per_page', 20))  # Default 20 transactions per page
        export_format = data.get('export_format')  # 'csv' for CSV export
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:  # Limit max per_page to 100
            per_page = 20
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Start building the query with parameters
            query = f"SELECT * FROM {username}_transaction WHERE 1=1"
            params = []
            
            # Add date filters if provided
            if start_date:
                query += " AND timedate >= ?"
                params.append(start_date)
            
            if end_date:
                query += " AND timedate <= ?"
                params.append(end_date)
            
            # Add transaction type filter if provided
            if transaction_type:
                if transaction_type.lower() == 'deposit':
                    query += " AND transaction_type LIKE '%Deposit%'"
                elif transaction_type.lower() == 'withdraw':
                    query += " AND transaction_type LIKE '%Withdraw%'"
                elif transaction_type.lower() == 'transfer':
                    query += " AND transaction_type LIKE '%Transfer%'"
            
            # Add ordering and pagination
            offset = (page - 1) * per_page
            query += " ORDER BY timedate DESC LIMIT ? OFFSET ?"
            params.extend([per_page, offset])
            
            # Execute the query
            cursor.execute(query, params)
            transactions = cursor.fetchall()
            
            # Get total count for pagination
            count_query = f"SELECT COUNT(*) as total FROM {username}_transaction WHERE 1=1"
            count_params = []
            
            # Add the same filters to count query
            if start_date:
                count_query += " AND timedate >= ?"
                count_params.append(start_date)
            
            if end_date:
                count_query += " AND timedate <= ?"
                count_params.append(end_date)
            
            if transaction_type:
                if transaction_type.lower() == 'deposit':
                    count_query += " AND transaction_type LIKE '%Deposit%'"
                elif transaction_type.lower() == 'withdraw':
                    count_query += " AND transaction_type LIKE '%Withdraw%'"
                elif transaction_type.lower() == 'transfer':
                    count_query += " AND transaction_type LIKE '%Transfer%'"
            
            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()['total']
            total_pages = (total_count + per_page - 1) // per_page  # Ceiling division
            
            # Format the transaction data
            transaction_list = []
            for trans in transactions:
                transaction_list.append({
                    'timedate': trans['timedate'],
                    'account_number': trans['account_number'],
                    'transaction_type': trans['transaction_type'],
                    'amount': trans['amount'],
                    'donor_id': trans['donor_id'],
                    'cause': trans['cause'] if 'cause' in trans.keys() else None,  # Add cause to response
                    # Add additional useful data
                    'transaction_direction': 'credit' if 'Deposit' in trans['transaction_type'] or 'From' in trans['transaction_type'] or 'Received' in trans['transaction_type'] else 'debit'
                })
            
            # Check if we need to export to CSV
            if export_format == 'csv':
                # Create CSV in memory
                output = io.StringIO()
                csv_writer = csv.writer(output)
                
                # Write header
                csv_writer.writerow(['Date & Time', 'Account Number', 'Transaction Type', 'Amount', 'Direction', 'Reference ID', 'Cause'])
                
                # Write data
                for trans in transaction_list:
                    csv_writer.writerow([
                        trans['timedate'],
                        trans['account_number'],
                        trans['transaction_type'],
                        trans['amount'],
                        trans['transaction_direction'],
                        trans['donor_id'] or 'N/A',
                        trans['cause'] or 'N/A'
                    ])
                
                # Create response
                output.seek(0)
                current_date = datetime.now().strftime("%Y-%m-%d")
                response = make_response(output.getvalue())
                response.headers["Content-Disposition"] = f"attachment; filename=ePassbook_{username}_{current_date}.csv"
                response.headers["Content-Type"] = "text/csv"
                
                conn.close()
                return response
            
            conn.close()
            
            # Return the paginated results with metadata
            return jsonify({
                'success': True,
                'transactions': transaction_list,
                'pagination': {
                    'total_records': total_count,
                    'total_pages': total_pages,
                    'current_page': page,
                    'per_page': per_page,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            })
        except sqlite3.OperationalError as e:
            # Table doesn't exist yet or other SQLite error
            conn.close()
            return jsonify({
                'success': False,
                'message': f'Database operation error: {str(e)}',
                'transactions': []
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing request: {str(e)}'}), 500

@app.route('/api/epassbook/summary', methods=['POST'])
def api_epassbook_summary():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No JSON data provided'}), 400
            
        username = data.get('username')
        if not username:
            return jsonify({'success': False, 'message': 'Username is required'}), 400
            
        # Optional parameters for date range
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Get basic account details
            cursor.execute("SELECT name, account_number, balance FROM customers WHERE username = ?", (username,))
            account_info = cursor.fetchone()
            
            if not account_info:
                conn.close()
                return jsonify({'success': False, 'message': 'Account not found'}), 404
            
            # Build queries with parameters for transaction analysis
            params = []
            where_clause = "1=1"
            
            if start_date:
                where_clause += " AND timedate >= ?"
                params.append(start_date)
            
            if end_date:
                where_clause += " AND timedate <= ?"
                params.append(end_date)
            
            # Get total deposits
            cursor.execute(f"""
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM {username}_transaction 
                WHERE {where_clause} AND (
                    transaction_type LIKE '%Deposit%' OR 
                    transaction_type LIKE '%From%' OR 
                    transaction_type LIKE '%Received%'
                )
            """, params)
            total_deposits = cursor.fetchone()['total']
            
            # Get total withdrawals
            cursor.execute(f"""
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM {username}_transaction 
                WHERE {where_clause} AND (
                    transaction_type LIKE '%Withdraw%' OR 
                    transaction_type LIKE '%Transfer ->%'
                )
            """, params)
            total_withdrawals = cursor.fetchone()['total']
            
            # Get transaction counts
            cursor.execute(f"""
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN transaction_type LIKE '%Deposit%' THEN 1 ELSE 0 END) as deposit_count,
                    SUM(CASE WHEN transaction_type LIKE '%Withdraw%' THEN 1 ELSE 0 END) as withdrawal_count,
                    SUM(CASE WHEN transaction_type LIKE '%Transfer%' THEN 1 ELSE 0 END) as transfer_count
                FROM {username}_transaction 
                WHERE {where_clause}
            """, params)
            counts = cursor.fetchone()
            
            # Get first transaction date
            cursor.execute(f"SELECT MIN(timedate) as first_date FROM {username}_transaction WHERE {where_clause}", params)
            first_transaction = cursor.fetchone()['first_date']
            
            # Get most recent transaction
            cursor.execute(f"SELECT MAX(timedate) as last_date FROM {username}_transaction WHERE {where_clause}", params)
            last_transaction = cursor.fetchone()['last_date']
            
            conn.close()
            
            # Calculate net flow
            net_flow = total_deposits - total_withdrawals
            
            # Return the account summary
            return jsonify({
                'success': True,
                'account_summary': {
                    'name': account_info['name'],
                    'account_number': account_info['account_number'],
                    'current_balance': account_info['balance'],
                    'total_deposits': total_deposits,
                    'total_withdrawals': total_withdrawals,
                    'net_flow': net_flow,
                    'transaction_count': {
                        'total': counts['total_transactions'],
                        'deposits': counts['deposit_count'],
                        'withdrawals': counts['withdrawal_count'],
                        'transfers': counts['transfer_count']
                    },
                    'first_transaction_date': first_transaction,
                    'last_transaction_date': last_transaction,
                    'period': {
                        'start_date': start_date or first_transaction,
                        'end_date': end_date or last_transaction
                    }
                }
            })
        except sqlite3.OperationalError as e:
            # Table doesn't exist yet or other SQLite error
            conn.close()
            return jsonify({
                'success': False,
                'message': f'Database operation error: {str(e)}'
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing request: {str(e)}'}), 500

@app.route('/api/delete_user', methods=['POST'])
def api_delete_user():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No JSON data provided'}), 400
            
        username = data.get('username')
        admin_password = data.get('admin_password')
        confirmation = data.get('confirmation')

        # Basic validation
        if not all([username, admin_password, confirmation]):
            return jsonify({'success': False, 'message': 'Username, admin password, and confirmation are required'}), 400
            
        # Simple admin password check - in production, use a more secure method
        if admin_password != "admin123":  # Replace with actual admin password or better auth
            return jsonify({'success': False, 'message': 'Invalid admin credentials'}), 401
            
        # Confirmation check
        if confirmation.lower() != f"delete {username}":
            return jsonify({'success': False, 'message': 'Confirmation text does not match "delete {username}"'}), 400
        
        # Use the Bank class to delete the user
        from bank import Bank
        
        result = Bank.delete_user(username)
        
        if result:
            return jsonify({
                'success': True,
                'message': f'User {username} has been successfully deleted'
            })
        else:
            return jsonify({'success': False, 'message': f'Failed to delete user {username}'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/blockchain/status', methods=['GET'])
def api_blockchain_status():
    """Get blockchain connection status and information"""
    try:
        status = blockchain.get_blockchain_status()
        return jsonify({
            'success': True,
            'blockchain_status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'blockchain_status': {'connected': False, 'error': str(e)}
        }), 500

@app.route('/api/blockchain/ngo-balance/<account_number>', methods=['GET'])
def api_ngo_blockchain_balance(account_number):
    """Get NGO balance from blockchain"""
    try:
        balance = blockchain.get_ngo_balance_from_blockchain(account_number)
        if balance is not None:
            return jsonify({
                'success': True,
                'account_number': account_number,
                'blockchain_balance': balance,
                'ngo_id': f"NGO_{account_number}"
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to fetch balance from blockchain'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Banking Simulation Server...")
    print("Access the application at: http://localhost:5050")
    
    # Initialize blockchain connection on startup
    try:
        print("🔗 Initializing blockchain connection...")
        if blockchain.connect():
            print("✅ Blockchain integration ready!")
            status = blockchain.get_blockchain_status()
            print(f"   Contract: {status.get('contract_address', 'Unknown')}")
            print(f"   Account: {status.get('account', 'Unknown')}")
            print(f"   Latest Block: {status.get('latest_block', 'Unknown')}")
        else:
            print("⚠️ Blockchain connection failed - running without blockchain integration")
    except Exception as e:
        print(f"❌ Blockchain initialization error: {e}")
        print("⚠️ Continuing without blockchain integration")
    
    app.run(debug=True, host='0.0.0.0', port=5050)

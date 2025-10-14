// Banking System Frontend JavaScript - Connected to Backend
class BankingSystem {
    constructor() {
        this.currentUser = null;
        this.baseURL = 'http://localhost:5050/api';
        this.init();
    }

    init() {
        this.showWelcome();
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showWelcome() {
        this.showScreen('welcome-screen');
    }

    showSignUp() {
        this.showScreen('signup-screen');
        document.getElementById('signup-form').reset();
    }

    showSignIn() {
        this.showScreen('signin-screen');
        document.getElementById('signin-form').reset();
    }

    showDashboard() {
        this.showScreen('dashboard-screen');
        this.updateUserDisplay();
    }

    showBalanceEnquiry() {
        this.showScreen('balance-screen');
        this.updateBalance();
    }

    showDeposit() {
        this.showScreen('deposit-screen');
        document.getElementById('deposit-form').reset();
    }

    showWithdraw() {
        this.showScreen('withdraw-screen');
        document.getElementById('withdraw-form').reset();
    }

    showFundTransfer() {
        this.showScreen('transfer-screen');
        document.getElementById('transfer-form').reset();
    }

    showPassbook() {
        this.showScreen('passbook-screen');
        this.initPassbook();
    }

    // API Communication Methods
    async apiCall(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    // Passbook Methods
    async initPassbook() {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            this.showWelcome();
            return;
        }

        // Set default date range (last month)
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        // Set date inputs with default values
        document.getElementById('filter-start-date').value = formatDate(lastMonth);
        document.getElementById('filter-end-date').value = formatDate(today);

        // Set passbook header information
        document.getElementById('passbook-name').textContent = this.currentUser.name;
        document.getElementById('passbook-account-number').textContent = this.currentUser.account_number;
        
        // Initialize passbook state
        this.passbookState = {
            page: 1,
            per_page: 10,
            transaction_type: '',
            start_date: formatDate(lastMonth),
            end_date: formatDate(today),
            totalPages: 1
        };
        
        // Load account summary
        await this.loadPassbookSummary();
        
        // Load initial transactions
        await this.loadPassbookTransactions();
        
        // Set up event listeners (removing any existing ones first)
        const applyFiltersBtn = document.getElementById('apply-filters');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const exportCsvBtn = document.getElementById('export-csv');
        
        // Remove existing event listeners (clone and replace)
        const newApplyFiltersBtn = applyFiltersBtn.cloneNode(true);
        applyFiltersBtn.parentNode.replaceChild(newApplyFiltersBtn, applyFiltersBtn);
        
        const newPrevPageBtn = prevPageBtn.cloneNode(true);
        prevPageBtn.parentNode.replaceChild(newPrevPageBtn, prevPageBtn);
        
        const newNextPageBtn = nextPageBtn.cloneNode(true);
        nextPageBtn.parentNode.replaceChild(newNextPageBtn, nextPageBtn);
        
        const newExportCsvBtn = exportCsvBtn.cloneNode(true);
        exportCsvBtn.parentNode.replaceChild(newExportCsvBtn, exportCsvBtn);
        
        // Add new event listeners
        newApplyFiltersBtn.addEventListener('click', async () => {
            // Update filter values
            this.passbookState.transaction_type = document.getElementById('filter-type').value;
            this.passbookState.start_date = document.getElementById('filter-start-date').value;
            this.passbookState.end_date = document.getElementById('filter-end-date').value;
            this.passbookState.page = 1; // Reset to first page
            
            // Reload data with new filters
            await this.loadPassbookSummary();
            await this.loadPassbookTransactions();
        });
        
        newPrevPageBtn.addEventListener('click', async () => {
            if (this.passbookState.page > 1) {
                this.passbookState.page--;
                await this.loadPassbookTransactions();
            }
        });
        
        newNextPageBtn.addEventListener('click', async () => {
            if (this.passbookState.page < this.passbookState.totalPages) {
                this.passbookState.page++;
                await this.loadPassbookTransactions();
            }
        });
        
        newExportCsvBtn.addEventListener('click', () => {
            this.exportPassbookCSV();
        });
    }
    
    async loadPassbookSummary() {
        if (!this.currentUser) return;
        
        try {
            const data = {
                username: this.currentUser.username,
                start_date: this.passbookState.start_date,
                end_date: this.passbookState.end_date
            };
            
            const result = await this.apiCall('/api/epassbook/summary', data);
            
            if (result.success) {
                const summary = result.account_summary;
                
                // Update summary cards
                document.getElementById('total-deposits').textContent = '₹' + summary.total_deposits.toLocaleString();
                document.getElementById('total-withdrawals').textContent = '₹' + summary.total_withdrawals.toLocaleString();
                document.getElementById('total-transactions').textContent = summary.transaction_count.total.toLocaleString();
                
                // Update current balance
                document.getElementById('passbook-balance').textContent = summary.current_balance.toLocaleString();
                
                // Update global user balance
                this.currentUser.balance = summary.current_balance;
                this.updateBalance();
            } else {
                console.error('Failed to load account summary:', result.message);
                this.showError('Failed to load account summary. ' + result.message);
            }
        } catch (error) {
            console.error('Error loading account summary:', error);
            this.showError('Error loading account summary. Please try again.');
        }
    }
    
    async loadPassbookTransactions() {
        if (!this.currentUser) return;
        
        try {
            const data = {
                username: this.currentUser.username,
                page: this.passbookState.page,
                per_page: this.passbookState.per_page,
                transaction_type: this.passbookState.transaction_type,
                start_date: this.passbookState.start_date,
                end_date: this.passbookState.end_date
            };
            
            const result = await this.apiCall('/api/epassbook', data);
            
            if (result.success) {
                const transactions = result.transactions;
                const pagination = result.pagination;
                
                // Update pagination info
                this.passbookState.totalPages = pagination.total_pages;
                document.getElementById('page-info').textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
                
                // Enable/disable pagination buttons
                document.getElementById('prev-page').disabled = pagination.current_page <= 1;
                document.getElementById('next-page').disabled = pagination.current_page >= pagination.total_pages;
                
                // Clear transactions list
                const transactionsList = document.getElementById('transactions-list');
                transactionsList.innerHTML = '';
                
                // Show "No transactions" message if necessary
                const noTransactionsMsg = document.getElementById('no-transactions');
                if (transactions.length === 0) {
                    noTransactionsMsg.classList.remove('hidden');
                } else {
                    noTransactionsMsg.classList.add('hidden');
                    
                    // Add each transaction to the table
                    transactions.forEach(tx => {
                        const row = document.createElement('tr');
                        
                        // Format date
                        const txDate = new Date(tx.timedate);
                        const formattedDate = txDate.toLocaleString();
                        
                        // Determine transaction class (credit/debit)
                        const amountClass = tx.transaction_direction === 'credit' ? 'transaction-credit' : 'transaction-debit';
                        const amountPrefix = tx.transaction_direction === 'credit' ? '+' : '-';
                        
                        row.innerHTML = `
                            <td>${formattedDate}</td>
                            <td>${tx.transaction_type}</td>
                            <td class="${amountClass}">${amountPrefix}₹${tx.amount.toLocaleString()}</td>
                            <td>${tx.donor_id || 'N/A'}</td>
                        `;
                        
                        transactionsList.appendChild(row);
                    });
                }
            } else {
                console.error('Failed to load transactions:', result.message);
                this.showError('Failed to load transactions. ' + result.message);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error loading transactions. Please try again.');
        }
    }
    
    exportPassbookCSV() {
        if (!this.currentUser) return;
        
        // Create form data
        const formData = new FormData();
        formData.append('username', this.currentUser.username);
        formData.append('export_format', 'csv');
        formData.append('transaction_type', this.passbookState.transaction_type);
        formData.append('start_date', this.passbookState.start_date);
        formData.append('end_date', this.passbookState.end_date);
        
        // Create a temporary form element
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${this.baseURL}/api/epassbook`;
        form.target = '_blank'; // Open in new tab
        form.style.display = 'none';
        
        // Add form fields
        for (const [key, value] of Object.entries({
            username: this.currentUser.username,
            export_format: 'csv',
            transaction_type: this.passbookState.transaction_type,
            start_date: this.passbookState.start_date,
            end_date: this.passbookState.end_date
        })) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        
        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    // User Management
    async signUp(userData) {
        const { username, password, name, age, city } = userData;

        const result = await this.apiCall('/signup', {
            username, password, name, age, city
        });

        if (result.success) {
            this.showSuccess(result.message);
            setTimeout(() => {
                this.showSignIn();
            }, 3000);
        } else {
            this.showError(result.message);
        }

        return result.success;
    }

    async signIn(username, password) {
        const result = await this.apiCall('/signin', {
            username, password
        });

        if (result.success) {
            this.currentUser = result.user;
            this.showSuccess(result.message);
            setTimeout(() => {
                this.showDashboard();
            }, 1500);
        } else {
            this.showError(result.message);
        }

        return result.success;
    }

    logout() {
        this.currentUser = null;
        this.showSuccess('Logged out successfully!');
        setTimeout(() => {
            this.showWelcome();
        }, 1500);
    }

    // Banking Operations
    async deposit(amount) {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            return false;
        }

        if (amount <= 0) {
            this.showError('Please enter a valid amount greater than 0.');
            return false;
        }

        const result = await this.apiCall('/deposit', {
            username: this.currentUser.username,
            account_number: this.currentUser.account_number,
            amount: amount
        });

        if (result.success) {
            this.currentUser.balance = result.new_balance;
            this.showSuccess(result.message + ` New balance: ₹${result.new_balance}`);
            setTimeout(() => {
                this.showDashboard();
            }, 2000);
        } else {
            this.showError(result.message);
        }

        return result.success;
    }

    async withdraw(amount) {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            return false;
        }

        if (amount <= 0) {
            this.showError('Please enter a valid amount greater than 0.');
            return false;
        }

        const result = await this.apiCall('/withdraw', {
            username: this.currentUser.username,
            account_number: this.currentUser.account_number,
            amount: amount
        });

        if (result.success) {
            this.currentUser.balance = result.new_balance;
            this.showSuccess(result.message + ` New balance: ₹${result.new_balance}`);
            setTimeout(() => {
                this.showDashboard();
            }, 2000);
        } else {
            this.showError(result.message);
        }

        return result.success;
    }

    async fundTransfer(receiverAccountNumber, amount) {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            return false;
        }

        if (amount <= 0) {
            this.showError('Please enter a valid amount greater than 0.');
            return false;
        }

        const result = await this.apiCall('/transfer', {
            username: this.currentUser.username,
            account_number: this.currentUser.account_number,
            receiver_account: receiverAccountNumber,
            amount: amount
        });

        if (result.success) {
            this.currentUser.balance = result.new_balance;
            this.showSuccess(result.message + ` New balance: ₹${result.new_balance}`);
            setTimeout(() => {
                this.showDashboard();
            }, 2000);
        } else {
            this.showError(result.message);
        }

        return result.success;
    }

    async getBalance() {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            return false;
        }

        const result = await this.apiCall('/balance', {
            username: this.currentUser.username
        });

        if (result.success) {
            this.currentUser.balance = result.balance;
            return result.balance;
        } else {
            this.showError(result.message);
            return null;
        }
    }

    // Passbook Methods
    async initPassbook() {
        if (!this.currentUser) {
            this.showError('Please log in first.');
            this.showWelcome();
            return;
        }

        // Set passbook header information
        document.getElementById('passbook-name').textContent = this.currentUser.name;
        document.getElementById('passbook-account-number').textContent = this.currentUser.account_number;
        document.getElementById('passbook-balance').textContent = this.currentUser.balance.toLocaleString();
        
        // Initialize passbook state
        this.passbookState = {
            page: 1,
            per_page: 10,
            transaction_type: '',
            start_date: '',
            end_date: '',
            totalPages: 1
        };
        
        // Load account summary
        await this.loadPassbookSummary();
        
        // Load initial transactions
        await this.loadPassbookTransactions();
        
        // Set up event listeners
        document.getElementById('apply-filters').addEventListener('click', async () => {
            // Update filter values
            this.passbookState.transaction_type = document.getElementById('filter-type').value;
            this.passbookState.start_date = document.getElementById('filter-start-date').value;
            this.passbookState.end_date = document.getElementById('filter-end-date').value;
            this.passbookState.page = 1; // Reset to first page
            
            // Reload data with new filters
            await this.loadPassbookSummary();
            await this.loadPassbookTransactions();
        });
        
        document.getElementById('prev-page').addEventListener('click', async () => {
            if (this.passbookState.page > 1) {
                this.passbookState.page--;
                await this.loadPassbookTransactions();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', async () => {
            if (this.passbookState.page < this.passbookState.totalPages) {
                this.passbookState.page++;
                await this.loadPassbookTransactions();
            }
        });
        
        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportPassbookCSV();
        });
    }
    
    async loadPassbookSummary() {
        if (!this.currentUser) return;
        
        try {
            const data = {
                username: this.currentUser.username,
                start_date: this.passbookState.start_date,
                end_date: this.passbookState.end_date
            };
            
            const result = await this.apiCall('/epassbook/summary', data);
            
            if (result.success) {
                const summary = result.account_summary;
                
                // Update summary cards
                document.getElementById('total-deposits').textContent = '₹' + summary.total_deposits.toLocaleString();
                document.getElementById('total-withdrawals').textContent = '₹' + summary.total_withdrawals.toLocaleString();
                document.getElementById('total-transactions').textContent = summary.transaction_count.total.toLocaleString();
                
                // Update current balance
                document.getElementById('passbook-balance').textContent = summary.current_balance.toLocaleString();
                this.currentUser.balance = summary.current_balance;
            } else {
                console.error('Failed to load account summary:', result.message);
            }
        } catch (error) {
            console.error('Error loading account summary:', error);
        }
    }
    
    async loadPassbookTransactions() {
        if (!this.currentUser) return;
        
        try {
            const data = {
                username: this.currentUser.username,
                page: this.passbookState.page,
                per_page: this.passbookState.per_page,
                transaction_type: this.passbookState.transaction_type,
                start_date: this.passbookState.start_date,
                end_date: this.passbookState.end_date
            };
            
            const result = await this.apiCall('/epassbook', data);
            
            if (result.success) {
                const transactions = result.transactions;
                const pagination = result.pagination;
                
                // Update pagination info
                this.passbookState.totalPages = pagination.total_pages;
                document.getElementById('page-info').textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
                
                // Enable/disable pagination buttons
                document.getElementById('prev-page').disabled = !pagination.has_prev;
                document.getElementById('next-page').disabled = !pagination.has_next;
                
                // Clear transactions list
                const transactionsList = document.getElementById('transactions-list');
                transactionsList.innerHTML = '';
                
                // Show "No transactions" message if necessary
                const noTransactionsMsg = document.getElementById('no-transactions');
                if (transactions.length === 0) {
                    noTransactionsMsg.classList.remove('hidden');
                } else {
                    noTransactionsMsg.classList.add('hidden');
                    
                    // Add each transaction to the table
                    transactions.forEach(tx => {
                        const row = document.createElement('tr');
                        
                        // Format date
                        const txDate = new Date(tx.timedate);
                        const formattedDate = txDate.toLocaleString();
                        
                        // Determine transaction class (credit/debit)
                        const amountClass = tx.transaction_direction === 'credit' ? 'transaction-credit' : 'transaction-debit';
                        const amountPrefix = tx.transaction_direction === 'credit' ? '+' : '-';
                        
                        row.innerHTML = `
                            <td>${formattedDate}</td>
                            <td>${tx.transaction_type}</td>
                            <td class="${amountClass}">${amountPrefix}₹${tx.amount.toLocaleString()}</td>
                            <td>${tx.donor_id || 'N/A'}</td>
                        `;
                        
                        transactionsList.appendChild(row);
                    });
                }
            } else {
                console.error('Failed to load transactions:', result.message);
                this.showError('Failed to load transactions. ' + result.message);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error loading transactions. Please try again.');
        }
    }
    
    exportPassbookCSV() {
        if (!this.currentUser) return;
        
        const queryParams = new URLSearchParams({
            username: this.currentUser.username,
            export_format: 'csv',
            transaction_type: this.passbookState.transaction_type,
            start_date: this.passbookState.start_date,
            end_date: this.passbookState.end_date
        });
        
        // Create a form for the POST request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${this.baseURL}/epassbook`;
        form.style.display = 'none';
        
        // Add fields to the form
        for (const [key, value] of queryParams.entries()) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        
        // Add form to the document and submit it
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    // Utility Methods
    updateUserDisplay() {
        if (this.currentUser) {
            document.getElementById('username-display').textContent = this.currentUser.name;
            document.getElementById('account-number-display').textContent = this.currentUser.account_number;
        }
    }

    async updateBalance() {
        if (this.currentUser) {
            const balance = await this.getBalance();
            if (balance !== null) {
                document.getElementById('balance-amount').textContent = balance.toLocaleString();
            }
        }
    }

    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        const textElement = document.getElementById('success-text');

        textElement.textContent = message;
        successElement.classList.remove('hidden');

        setTimeout(() => {
            successElement.classList.add('hidden');
        }, 5000);
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        const textElement = document.getElementById('error-text');

        textElement.textContent = message;
        errorElement.classList.remove('hidden');

        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the banking system
const bankingSystem = new BankingSystem();

// Global functions for HTML event handlers
function showWelcome() {
    bankingSystem.showWelcome();
}

function showSignUp() {
    bankingSystem.showSignUp();
}

function showSignIn() {
    bankingSystem.showSignIn();
}

function showDashboard() {
    bankingSystem.showDashboard();
}

function showBalanceEnquiry() {
    bankingSystem.showBalanceEnquiry();
}

function showDeposit() {
    bankingSystem.showDeposit();
}

function showWithdraw() {
    bankingSystem.showWithdraw();
}

function showFundTransfer() {
    bankingSystem.showFundTransfer();
}

function logout() {
    bankingSystem.logout();
}

// Form submission handlers
async function handleSignUp(event) {
    event.preventDefault();

    const userData = {
        username: document.getElementById('signup-username').value.trim(),
        password: document.getElementById('signup-password').value,
        name: document.getElementById('signup-name').value.trim(),
        age: document.getElementById('signup-age').value,
        city: document.getElementById('signup-city').value.trim()
    };

    // Basic validation
    if (!userData.username || !userData.password || !userData.name || !userData.age || !userData.city) {
        bankingSystem.showError('Please fill in all fields.');
        return;
    }

    if (userData.age < 18) {
        bankingSystem.showError('You must be at least 18 years old to create an account.');
        return;
    }

    await bankingSystem.signUp(userData);
}

async function handleSignIn(event) {
    event.preventDefault();

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!username || !password) {
        bankingSystem.showError('Please enter both username and password.');
        return;
    }

    await bankingSystem.signIn(username, password);
}

async function handleDeposit(event) {
    event.preventDefault();

    const amount = parseInt(document.getElementById('deposit-amount').value);

    if (!amount || amount <= 0) {
        bankingSystem.showError('Please enter a valid amount greater than 0.');
        return;
    }

    await bankingSystem.deposit(amount);
}

async function handleWithdraw(event) {
    event.preventDefault();

    const amount = parseInt(document.getElementById('withdraw-amount').value);

    if (!amount || amount <= 0) {
        bankingSystem.showError('Please enter a valid amount greater than 0.');
        return;
    }

    await bankingSystem.withdraw(amount);
}

async function handleTransfer(event) {
    event.preventDefault();

    const receiverAccount = parseInt(document.getElementById('receiver-account').value);
    const amount = parseInt(document.getElementById('transfer-amount').value);

    if (!receiverAccount || !amount || amount <= 0) {
        bankingSystem.showError('Please enter valid account number and amount.');
        return;
    }

    await bankingSystem.fundTransfer(receiverAccount, amount);
}

// Check if server is running on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('http://localhost:5050/api/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test' })
        });
        console.log('Backend server is running');
    } catch (error) {
        console.warn('Backend server is not running. Please start the Flask server.');
        bankingSystem.showError('Backend server is not running. Please start the Flask server with: python app.py');
    }
});

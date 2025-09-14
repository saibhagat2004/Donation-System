// Banking System Frontend JavaScript - Connected to Backend
class BankingSystem {
    constructor() {
        this.currentUser = null;
        this.baseURL = 'http://localhost:5000/api';
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
        const response = await fetch('http://localhost:5000/api/balance', {
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

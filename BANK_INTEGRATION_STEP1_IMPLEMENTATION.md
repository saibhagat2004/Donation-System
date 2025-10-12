# Bank Withdrawal Integration - Step 1 Implementation

## ✅ What Has Been Implemented

### 1. **Database Model** 
- Created `PendingTransaction` model (`backend/models/pendingTransaction.model.js`)
- Tracks withdrawal notifications from bank
- Manages document upload deadlines and status
- Stores verification hashes for blockchain

### 2. **API Endpoints**
New routes in `backend/routers/bank.route.js`:

- `POST /api/bank/withdrawal-notification` - Receives notifications from bank API
- `GET /api/bank/pending-transactions/:ngoId` - Get pending transactions for NGO
- `GET /api/bank/pending-transactions/account/:accountNumber` - Get by bank account
- `POST /api/bank/upload-document/:transactionId` - Upload supporting documents
- `GET /api/bank/transaction-status/:transactionId` - Check transaction status
- `GET /api/bank/service-stats` - Service statistics

### 3. **Python Banking System Modified**
- Modified `Python-Bank-Project/app.py` withdrawal API
- **STOPPED** immediate blockchain recording
- **ADDED** notification to website backend
- NGO gets notification instead of automatic blockchain recording

### 4. **Background Service**
- Created `backend/services/pendingTransactionService.js`
- Automatically processes expired transactions
- Records transactions to blockchain after time limit
- Sends reminder notifications

### 5. **Test Interface**
- Created `backend/test-ngo-dashboard.html` 
- NGO dashboard for testing the workflow
- Simulates bank withdrawals
- Upload document interface

## 🔄 New Workflow

```
Bank Withdrawal → Website Notification → NGO Dashboard Alert → Upload Window (3 min) → Blockchain Recording
```

### Step-by-Step Process:

1. **Bank Withdrawal Detected**
   - Python banking API calls `/api/bank/withdrawal-notification`
   - Creates pending transaction record
   - Sets 3-minute upload deadline (configurable)

2. **NGO Notification**
   - NGO sees pending transaction on dashboard
   - Upload interface appears with countdown timer
   - Can upload document with Cloudinary URL + hash

3. **Document Upload**
   - NGO uploads receipt/proof via `/api/bank/upload-document`
   - Transaction status changes to "DOCUMENT_UPLOADED"

4. **Blockchain Recording**
   - Background service processes transactions after deadline
   - Records to blockchain with or without document
   - Updates transaction status to "RECORDED"

## 🧪 Testing

### 1. Start Backend Server
```bash
cd backend
npm install  # Install new node-cron dependency
npm run dev
```

### 2. Start Python Banking System
```bash
cd Python-Bank-Project
python app.py
```

### 3. Access Test Dashboard
- Visit: http://localhost:5000/test-ngo-dashboard
- Use account number: `12345678` (or create NGO with this bank account)

### 4. Simulate Workflow
1. Enter bank account and amount in test section
2. Click "Simulate Bank Withdrawal"
3. Watch pending transaction appear
4. Upload document within 3 minutes
5. See status change to "Document Uploaded"

## ⚙️ Configuration

### Time Limits
In `backend/models/pendingTransaction.model.js`:
```javascript
// Line 120: Change upload window
const uploadWindow = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 3 * 60 * 1000;
```

### Backend Service Processing
In `backend/services/pendingTransactionService.js`:
```javascript
// Line 25: Change processing frequency
cron.schedule('* * * * *', () => { // Every minute
```

## 📋 Required NGO Setup

For testing, create an NGO user with:
```javascript
{
  role: "ngo",
  ngoDetails: {
    bank_account: "12345678"  // Match the account number used in tests
  }
}
```

## 🔗 Integration Points

### Bank API Integration
- Bank system calls: `POST /api/bank/withdrawal-notification`
- Payload includes: account_number, amount, transaction_id, cause

### Blockchain Integration
- Currently simulated in `pendingTransactionService.js`
- Replace `simulateBlockchainRecording()` with actual blockchain calls

### Cloudinary Integration  
- NGOs upload documents to Cloudinary
- Provide Cloudinary URL + hash via upload endpoint

## 📊 Monitoring

Check service status:
```bash
curl http://localhost:5000/api/bank/service-stats
```

## ✅ What Works Now

1. ✅ Bank withdrawal notifications create pending transactions
2. ✅ NGO dashboard shows pending withdrawals with countdown
3. ✅ Document upload within time limit
4. ✅ Automatic expiry handling
5. ✅ Background service processing
6. ✅ Status tracking and updates

## ✅ Step 2 & 3 Implementation Complete

### **Step 2: NGO Dashboard Notification** ✅
- **NGO Dashboard Created**: `frontend/src/pages/NGO/NGODashboard.jsx`
- **Real-time Notifications**: Auto-refresh every 30 seconds
- **Countdown Timer**: Shows exact time remaining for document upload
- **Visual Alerts**: Color-coded status indicators (pending/expired/uploaded)
- **Navigation Integration**: Added to sidebar and routing

### **Step 3: Document Handling** ✅
- **Cloudinary Integration**: Direct file upload to cloud storage
- **Document Upload Form**: `frontend/src/components/DocumentUploadForm.jsx`
- **Dual Upload Methods**: 
  - File upload (auto-uploads to Cloudinary)
  - Manual URL entry for existing documents
- **Document Validation**: File type, size limits, URL validation
- **Hash Generation**: Automatic for uploaded files, manual for URLs

### **Backend Services Added** ✅
- **Notification Service**: `backend/services/notificationService.js`
- **Blockchain Integration**: `backend/services/blockchainIntegration.js`
- **Enhanced Processing**: Automatic document handling and blockchain recording

## 🔄 Complete Workflow Now Working

```
Bank Withdrawal → Website Notification → NGO Dashboard Alert 
→ Countdown Timer (3 min) → Document Upload Interface 
→ Cloudinary Storage → Blockchain Recording
```

### **What Happens Now:**

1. **Bank Withdrawal Detected** 
   - Creates pending transaction
   - Sends notification to NGO
   - Starts 3-minute countdown

2. **NGO Dashboard Shows Alert**
   - Real-time pending transactions display
   - Countdown timer with visual urgency indicators
   - Upload interface appears

3. **Document Upload Process**
   - **Option A**: Upload file directly (auto-uploads to Cloudinary)
   - **Option B**: Provide existing Cloudinary URL + hash
   - Form validation and progress indicators

4. **After Upload/Timeout**
   - Status changes to "Document Uploaded" or "Expired"  
   - Background service records to blockchain
   - Confirmation notifications sent

## 🧪 Testing the Complete Flow

### 1. Setup Cloudinary Upload Preset
- See `CLOUDINARY_DOCUMENT_UPLOAD_SETUP.md` for setup instructions
- Create `ngo_documents` preset in Cloudinary console

### 2. Start Services
```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev

# Python Bank
cd Python-Bank-Project
python app.py
```

### 3. Test Complete Workflow
1. **Access NGO Dashboard**: `http://localhost:3000/ngo-dashboard`
2. **Simulate Withdrawal**: Use test interface or bank API
3. **See Real-time Alert**: Dashboard shows pending transaction with timer
4. **Upload Document**: Use either file upload or URL method
5. **Monitor Progress**: Watch status change and blockchain recording

## 📊 Monitoring & Stats

### Service Statistics
```bash
curl http://localhost:5000/api/bank/service-stats
```

### Notification History
- In-memory notification tracking
- Success/failure rates
- Notification types and timing

## ⚙️ Configuration

### Time Limits
- **Development**: 3 minutes (for testing)
- **Production**: 24 hours (configurable in `pendingTransaction.model.js`)

### Cloudinary Settings
- **Max File Size**: 5MB
- **Allowed Types**: JPEG, PNG, PDF
- **Storage Folder**: `ngo-documents`
- **Auto Optimization**: Quality and format

## 🔜 Next Steps

- **Step 4**: Production Cloudinary security (signed uploads)
- **Step 5**: Email/SMS integration for notifications
- **Step 6**: Actual blockchain service integration
- **Step 7**: Mobile responsive dashboard
- **Step 8**: Bulk document processing
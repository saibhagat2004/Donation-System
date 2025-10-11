# Blockchain Integration Test Plan

## Overview
This document outlines how to test the blockchain integration that now shows:
1. **Campaign Details Page**: NGO-specific transactions only (filtered by beneficiary ID)
2. **Blockchain Transparency Page**: All NGO transactions across the platform

## Prerequisites
1. ✅ Frontend running on http://localhost:4000
2. ⚠️  Ganache blockchain running on http://localhost:7545
3. ⚠️  Backend server running (for campaign data)
4. ⚠️  Python banking system running (for blockchain transactions)

## NGO ID Mapping  
The system now correctly maps NGO bank accounts to blockchain IDs:
- NGO `ngoDetails.bank_account`: `89176024`
- Blockchain `ngoId`: `NGO_89176024`

**Data Flow**: Campaign → created_by (NGO User) → ngoDetails.bank_account → NGO_XXXXXXXX

## Test Scenarios

### 1. Campaign Details Page Test
**What to test**: NGO-specific blockchain widget

**Steps**:
1. Navigate to any campaign details page
2. Look for "Blockchain Verified" widget in the right sidebar
3. The widget should show:
   - **If NGO has blockchain transactions**: Balance, transaction count, recent transactions
   - **If NGO not found**: "NGO Not Found on Blockchain" message
   - **If blockchain offline**: "Blockchain Offline" warning

**Expected behavior**:
- Shows only transactions for the specific NGO (e.g., NGO_89176024)
- Console logs show: Campaign NGO mapping details
- Widget displays NGO-specific data, not platform-wide data

### 2. Blockchain Transparency Page Test  
**What to test**: Platform-wide blockchain transparency

**Steps**:
1. Navigate to `/blockchain` (or use sidebar "Blockchain Transparency")
2. Should show all NGO transactions across the platform
3. Test filtering:
   - Default: "All NGOs (X total)" selected
   - Select specific NGO to filter
   - Clear filter to return to all NGOs

**Expected behavior**:
- Shows transactions from all NGOs by default
- Filter dropdown shows all active NGOs  
- Pagination and transaction details work correctly

### 3. NGO-Specific Details Page Test
**What to test**: Individual NGO blockchain details

**Steps**:
1. From main blockchain page, click on any NGO ID
2. Navigate to `/blockchain/ngo/NGO_XXXXXXXX`
3. Should show complete transaction history for that specific NGO

**Expected behavior**:
- Shows only transactions for the selected NGO
- Displays NGO balance, incoming/outgoing transaction counts
- Financial summary with totals

## Debug Information

### Console Logging
Open browser console (F12) to see debug information:
```
BlockchainWidget - ngoId: NGO_89176024 showAllTransactions: false
Campaign NGO mapping: {
  campaignId: "campaign_id_here",
  ngoName: "NGO Name",
  bankAccount: "89176024",
  blockchainId: "NGO_89176024"
}
```

### Error Scenarios
1. **Blockchain Offline**: Yellow warning box
2. **NGO Not Found**: "NGO Not Found on Blockchain" message  
3. **No Transactions**: "No transactions found" message

## Production Deployment Notes

### Environment Variables
For production deployment (e.g., on render.com), set these environment variables:
```
VITE_BLOCKCHAIN_RPC_URL=https://your-ngrok-url.ngrok.io
VITE_CONTRACT_ADDRESS=0x9fC0c4B491bC255f1d1486aD586d404b425afD8F
VITE_CHAIN_ID=1337
```

### Ngrok Setup (for cloud-to-local connection)
If frontend is hosted but blockchain is local:
```bash
# Install ngrok globally
npm install -g ngrok

# Expose local Ganache
ngrok http 7545

# Use the generated URL in environment variables
```

## Validation Checklist

### ✅ Campaign Page Integration
- [ ] Widget appears in campaign sidebar
- [ ] Shows NGO-specific data only
- [ ] Handles "NGO not found" gracefully
- [ ] Console logs show correct NGO ID mapping

### ✅ Blockchain Transparency Page  
- [ ] Shows all NGO transactions by default
- [ ] Filter dropdown works correctly
- [ ] Individual NGO pages accessible
- [ ] Transaction tables display properly

### ✅ User Experience
- [ ] Loading states work correctly
- [ ] Error states are user-friendly  
- [ ] Navigation between pages works
- [ ] Responsive design on mobile

### ✅ Data Accuracy
- [ ] NGO IDs match between campaign and blockchain
- [ ] Transaction filtering works correctly
- [ ] Currency formatting is correct
- [ ] Date formatting is appropriate

## Troubleshooting

### Common Issues
1. **"Blockchain Offline"**: Check if Ganache is running on port 7545
2. **"NGO Not Found"**: NGO hasn't made blockchain transactions yet
3. **Import errors**: Check file paths and service dependencies
4. **Build errors**: Ensure ethers.js is installed correctly

### Quick Fixes
```bash
# Reinstall dependencies
cd frontend
npm install

# Check blockchain service
curl http://localhost:7545

# Rebuild frontend  
npm run build
```

## Next Steps
1. Test with real NGO data from your database
2. Verify blockchain transaction recording from Python banking system
3. Deploy to staging environment with ngrok
4. Set up production blockchain infrastructure
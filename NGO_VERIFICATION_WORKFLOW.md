# NGO Verification Workflow Documentation

## Overview
This document explains the complete NGO verification workflow from submission to admin approval.

---

## Workflow Steps

### 1. **NGO Signs Up**
- NGO creates an account with role `'ngo'`
- `verified` field is set to `false` by default
- NGO cannot create campaigns until verified

### 2. **NGO Submits Details**
- NGO navigates to `/add-ngo-beneficiary` or `/ngo-form`
- Fills out the beneficiary form with:
  - **Contact Details:** Name, Email, Phone
  - **Bank Details:** Bank Account, IFSC Code, VPA (optional)
  - **Address:** Address, City, State, Pincode
  - **Organization Details:** Org Name, PAN, GST (optional)
- Form submits to `/api/cashfreepg/addBeneficiary`
- Backend creates beneficiary in payment system
- Backend updates user's `ngoDetails` field with all information
- `verified` remains `false` - awaiting admin approval

### 3. **NGO Dashboard Status**
When NGO logs in to their dashboard at `/ngo-dashboard`:

**If NOT Verified:**
- Yellow banner shows "⏳ Verification Status: Pending"
- Message: "Your verification request is under admin review."
- Shows missing requirements if details incomplete
- Button to "Complete NGO Details" if needed

**If Verified:**
- Green banner shows "✓ Your NGO is Verified!"
- Message: "You can now create campaigns and receive donations."
- Full access to create campaigns

### 4. **Admin Reviews Request**
Admin accesses the admin dashboard at `/admin-dashboard`:

**Dashboard Features:**
- **Stats Cards:** Shows Total NGOs, Verified, Pending, Incomplete
- **Three Tabs:**
  - **Pending Verification:** NGOs waiting for approval (with beneficiary_id)
  - **Verified:** Already approved NGOs
  - **All NGOs:** Complete list with stats

**For Each Pending NGO:**
- View full details in modal:
  - Basic info (name, email, username, joined date)
  - Contact details
  - Organization details (name, PAN, GST, beneficiary ID)
  - Bank details (account, IFSC, VPA)
  - Address
  - Reputation scores
- Two action buttons:
  - ✓ **Verify NGO** - Approves the NGO
  - ✗ **Reject** - Rejects with optional reason

### 5. **Admin Approves/Rejects**

**Approve (PUT /api/admin/ngos/verify/:ngoId):**
- Sets `user.verified = true`
- NGO can now create campaigns
- NGO sees green verified banner on dashboard

**Reject (POST /api/admin/ngos/reject/:ngoId):**
- Keeps `user.verified = false`
- Can include rejection reason
- NGO remains in pending state

---

## API Endpoints

### NGO Endpoints
```
GET  /api/ngo/verification-status    - Check NGO verification status
GET  /api/ngo/profile                - Get NGO profile details
```

### Admin Endpoints (Protected - Admin Only)
```
GET  /api/admin/ngos                 - Get all NGOs with stats
GET  /api/admin/ngos/pending         - Get pending verification requests
GET  /api/admin/ngos/verified        - Get verified NGOs
GET  /api/admin/ngos/:ngoId          - Get specific NGO details
PUT  /api/admin/ngos/verify/:ngoId   - Approve/verify an NGO
POST /api/admin/ngos/reject/:ngoId   - Reject NGO verification
```

---

## Database Schema

### User Model (NGO Fields)
```javascript
{
  role: 'ngo',
  verified: false,  // Changed to true by admin
  ngoDetails: {
    beneficiary_id: String,  // Required for verification
    name: String,
    email: String,
    phone: String,
    bank_account: String,
    ifsc: String,
    vpa: String,
    address1: String,
    city: String,
    state: String,
    pincode: String,
    org_name: String,
    org_pan: String,
    org_gst: String
  }
}
```

---

## Frontend Pages

### 1. `/add-ngo-beneficiary` (AddNGOBeneficiary.jsx)
- Form to submit NGO details
- Validates required fields
- Shows success/error messages
- Sends data to backend

### 2. `/ngo-dashboard` (NGODashboard.jsx)
- Shows verification status banner
- Displays pending transactions
- Quick action links
- Color-coded status indicators

### 3. `/admin-dashboard` (AdminDashboard.jsx)
- Stats overview
- Tabbed interface (Pending/Verified/All)
- NGO list with details
- Approve/Reject buttons
- Detailed modal view

---

## Verification Status Object

```javascript
{
  is_verified: boolean,
  has_ngo_details: boolean,
  can_create_campaigns: boolean,  // true only if both above are true
  user: {
    id, name, email, role
  },
  missing_requirements: [
    "NGO verification pending",
    "NGO details incomplete"
  ],
  missing_ngo_details: [
    "Organization name",
    "Beneficiary ID",
    "Bank account",
    "IFSC code"
  ]
}
```

---

## Access Control

### Admin Middleware (isAdmin)
```javascript
// Checks if user role is 'admin'
// Returns 403 if not admin
// Used on all /api/admin/* routes
```

### Protected Routes
- All admin routes require authentication + admin role
- NGO routes require authentication + ngo role
- Create campaign requires verified NGO

---

## User Flow Diagram

```
NGO Signs Up → Role: 'ngo', Verified: false
      ↓
NGO Fills Form → Submits Beneficiary Details
      ↓
Backend Saves → ngoDetails filled, Verified: still false
      ↓
NGO Dashboard → Shows "Pending Verification" (Yellow)
      ↓
Admin Logs In → Sees NGO in "Pending" tab
      ↓
Admin Reviews → Views full NGO details
      ↓
Admin Approves → Sets verified: true
      ↓
NGO Dashboard → Shows "Verified!" (Green)
      ↓
NGO Creates Campaign → Now allowed!
```

---

## Testing the Flow

### As NGO:
1. Sign up with role 'ngo'
2. Go to `/add-ngo-beneficiary`
3. Fill and submit the form
4. Check `/ngo-dashboard` - should see yellow "Pending" banner
5. Try to create campaign - should see verification popup

### As Admin:
1. Sign up/login with role 'admin'
2. Go to `/admin-dashboard`
3. Click "Pending Verification" tab
4. See the newly registered NGO
5. Click on NGO to view details
6. Click "✓ Verify" button
7. Confirm approval

### As NGO (After Approval):
1. Refresh `/ngo-dashboard`
2. See green "Verified!" banner
3. Go to `/create-campaign` - now works!

---

## Environment Setup

### Creating First Admin User:
You'll need to manually set a user's role to 'admin' in MongoDB:

```javascript
// In MongoDB or using MongoDB Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or create a script:
```javascript
// backend/scripts/create-admin.js
import User from './models/user.model.js';
import connectMongoDB from './db/connectMongoDB.js';

await connectMongoDB();
await User.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
);
console.log("Admin created!");
process.exit(0);
```

---

## Security Notes

1. **Admin routes are protected** - Only users with `role: 'admin'` can access
2. **NGO verification is persistent** - Once verified, stays verified
3. **Campaign creation blocked** - Frontend and backend check verification status
4. **Rejection doesn't delete data** - NGO details remain, can be re-reviewed

---

## Future Enhancements

1. Email notifications when NGO is approved/rejected
2. Add rejection reason field to user model
3. Allow NGO to resubmit after rejection
4. Admin notes/comments on NGO profiles
5. Verification expiry/renewal system
6. Document upload and verification
7. Bulk approve/reject functionality

---

## Troubleshooting

**NGO can't see admin dashboard:**
- Check user role in database: `db.users.findOne({email: "..."})`
- Ensure role is exactly `"admin"` (case-sensitive)

**Verification status not updating:**
- Clear browser cache
- Check network tab for API errors
- Verify JWT token is being sent
- Check backend logs for errors

**Create campaign still blocked after verification:**
- Refresh the page
- Clear auth cache: `queryClient.invalidateQueries(['authUser'])`
- Check `/api/ngo/verification-status` response

---

## Complete File List

### Backend:
- `backend/controllers/admin.controller.js` - Admin functions
- `backend/routers/admin.route.js` - Admin routes
- `backend/controllers/ngo.controller.js` - NGO verification check
- `backend/models/user.model.js` - User schema with NGO fields
- `backend/server.js` - Route registration

### Frontend:
- `frontend/src/pages/Admin/AdminDashboard.jsx` - Admin dashboard
- `frontend/src/pages/NGO/NGODashboard.jsx` - NGO dashboard with status
- `frontend/src/pages/NGO/AddNGOBeneficiary.jsx` - Form to submit details
- `frontend/src/App.jsx` - Route definitions

---

## Questions?

If you need help:
1. Check the API endpoint in browser dev tools
2. Look at backend console for errors
3. Verify user role in database
4. Check if JWT token is valid
5. Test with Postman/curl to isolate frontend/backend issues

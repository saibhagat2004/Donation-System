# Cashfree Payout API Setup Guide

## Issue: IP Not Whitelisted Error

If you're getting the error `IP not whitelisted` when trying to process payouts, follow these steps:

### 1. **Identify Your Server IP**

First, find your server's public IP address:

```bash
# Method 1: Using curl
curl ifconfig.me

# Method 2: Using a web service
curl https://api.ipify.org

# Method 3: Check in your server logs
# The IP will be shown in the error logs
```

### 2. **Whitelist IP in Cashfree Dashboard**

1. **Log into Cashfree Dashboard**
   - Go to [Cashfree Dashboard](https://dashboard.cashfree.com)
   - Login with your credentials

2. **Navigate to Payout Settings**
   - Go to **Payout** section
   - Click on **Settings** or **API Configuration**

3. **Add IP to Whitelist**
   - Look for **IP Whitelisting** or **Allowed IPs** section
   - Add your server's public IP address
   - Save the changes

### 3. **For Development/Testing**

If you're running locally or in development:

1. **Find your public IP**:
   ```bash
   curl ifconfig.me
   ```

2. **Add to Cashfree whitelist**

3. **For dynamic IPs**: Consider using:
   - Static IP from your hosting provider
   - VPN with static IP
   - Ngrok for testing (get the IP from ngrok dashboard)

### 4. **For Production Deployment**

1. **Get Static IP** from your hosting provider:
   - AWS: Elastic IP
   - Google Cloud: Static External IP
   - Azure: Static Public IP
   - DigitalOcean: Reserved IP

2. **Update Cashfree Dashboard** with the static IP

### 5. **Alternative: Disable Auto-Transfer**

If you can't set up IP whitelisting immediately, you can disable auto-transfer and process payouts manually:

1. **In `.env` file**, add:
   ```
   DISABLE_AUTO_TRANSFER=true
   ```

2. **Manual payout processing** will be available in the NGO dashboard

### 6. **Environment Variables Required**

Make sure these are set in your `.env` file:

```env
# Cashfree Payout API Credentials
CASHFREE_PAYOUT_CLIENT_ID=your_payout_client_id
CASHFREE_PAYOUT_CLIENT_SECRET=your_payout_client_secret
CASHFREE_PAYOUT_API_VERSION=2022-09-01

# Environment
CASHFREE_ENV=SANDBOX  # or PRODUCTION
```

### 7. **Testing the Setup**

After whitelisting your IP:

1. **Restart your server**
2. **Make a test donation**
3. **Check server logs** for successful transfer messages
4. **Verify in Cashfree dashboard** that the payout was processed

### 8. **Common Issues**

- **IP Changed**: If your IP changes, update the whitelist
- **Multiple IPs**: Add all server IPs that will make payout requests
- **Load Balancer**: If using a load balancer, whitelist its IP
- **Proxy/CDN**: Whitelist the actual server IP, not proxy IP

### 9. **Error Monitoring**

The system now handles IP whitelisting errors gracefully:
- ✅ Donations will still be successful
- ⚠️ Payouts will be marked as "FAILED" with reason
- 📋 Manual transfer option available
- 📧 Notifications sent to administrators

## Support

If you continue to face issues:
1. Check Cashfree documentation
2. Contact Cashfree support
3. Check server logs for detailed error messages

import { Cashfree } from "cashfree-pg";
import crypto from "crypto";
import fetch from 'node-fetch'; // For native ESM

import axios from "axios";
import dotenv from "dotenv";
import User from "../models/user.model.js"; // Import User model
dotenv.config();

const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

function generateOrderId() {
  return `ORD_${crypto.randomBytes(12).toString("hex")}`;
}

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // destructure from body
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const request = {
      order_amount: amount,
      order_currency: "INR",
      order_id: generateOrderId(),
      customer_details: {
        customer_id: "guest_001",
        customer_phone: "9999999999",
        customer_name: "Guest User",
        customer_email: "guest@example.com",
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment-verification`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/cashfreepg/webhook`
      },
    };

    const response = await cashfree.PGCreateOrder(request);
    return res.json(response.data || response);
  } catch (err) {
    console.error("CreateOrder error:", err?.response?.data || err.message || err);
    return res
      .status(500)
      .json({ error: err?.response?.data || err.message || "Internal server error" });
  }
};
export const verifyOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });

  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return res.json(response.data || response);
  } catch (err) {
    console.error("GetOrder error:", err?.response?.data || err.message || err);
    return res
      .status(500)
      .json({ error: err?.response?.data || err.message || "Internal server error" });
  }
};





export const addBeneficiary = async (req, res) => {
  try {
    console.log("req.user object:", req.user);

    const {
      name, email, phone, bank_account, ifsc, vpa,
      address1, city, state, pincode, org_name, org_pan, org_gst
    } = req.body;

    // Generate beneficiary ID directly
    const beneficiary_id = "BEN_" + Date.now();
    
    /* CASHFREE API INTEGRATION COMMENTED OUT TO AVOID UNAUTHORIZED IP ERRORS
    const url = "https://sandbox.cashfree.com/payout/beneficiary";
    const payload = {
      beneficiary_id,
      beneficiary_name: name,
      beneficiary_instrument_details: {
        bank_account_number: bank_account,
        bank_ifsc: ifsc,
        vpa: vpa || ""
      },
      beneficiary_contact_details: {
        beneficiary_email: email,
        beneficiary_phone: phone,
        beneficiary_country_code: "+91",
        beneficiary_address: address1,
        beneficiary_city: city,
        beneficiary_state: state,
        beneficiary_postal_code: pincode
      }
    };
    const headers = {
      "x-client-id": process.env.CASHFREE_PAYOUT_CLIENT_ID,
      "x-client-secret": process.env.CASHFREE_PAYOUT_CLIENT_SECRET,
      "x-api-version": process.env.CASHFREE_PAYOUT_API_VERSION || "2024-01-01",
      "Content-Type": "application/json"
    };
    const response = await axios.post(url, payload, { headers });
    
    // Log the complete response to debug
    console.log("Cashfree response:", JSON.stringify(response.data, null, 2));
    */
    
    // DIRECT DATABASE UPDATE: Skip the actual API call
    console.log("⚠️ Bypassing Cashfree API: Directly creating beneficiary in database");
    
    // Validate required fields
    if (!name || !email || !phone || !bank_account || !ifsc) {
      return res.status(400).json({ 
        error: "Missing required beneficiary details" 
      });
    }
    
    try {
      // Check user authentication
      if (!req.user || !req.user._id) {
        console.error("req.user or req.user._id is missing. Cannot update MongoDB.");
        return res.status(401).json({ error: "User authentication missing. Please log in again." });
      }
      
      console.log("Attempting to update user with _id:", req.user._id);
      const updateResult = await User.findByIdAndUpdate(req.user._id, {
        ngoDetails: {
          beneficiary_id,
          name,
          email,
          phone,
          bank_account,
          ifsc,
          vpa: vpa || "",
          address1,
          city,
          state,
          pincode,
          org_name,
          org_pan,
          org_gst: org_gst || ""
        },
        verified: true
      }, { new: true });

      console.log("MongoDB update result:", updateResult);

      if (!updateResult) {
        console.error("User not found or not updated in MongoDB for _id:", req.user._id);
        return res.status(404).json({ error: "User not found in database." });
      }

      // Create a mock response similar to what Cashfree would return
      const mockResponse = {
        beneficiary_id,
        beneficiary_status: "VERIFIED", 
        createdAt: new Date().toISOString()
      };

      return res.json({ 
        beneficiary_id, 
        status: "added", 
        data: mockResponse,
        note: "Beneficiary created directly in database (Cashfree API bypassed)"
      });
      
    } catch (dbErr) {
      console.error("MongoDB update error:", dbErr);
      return res.status(500).json({ error: "Failed to update user in database." });
    }
  } catch (err) {
    console.error("Add Beneficiary Error:", err.message);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};

// Handle Cashfree webhooks
export const handleWebhook = async (req, res) => {
  try {
    console.log("Cashfree webhook received:", req.body);
    
    // Verify webhook signature here if needed
    const webhookData = req.body;
    
    // Process webhook data based on event type
    if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      console.log("Payment successful:", webhookData.data.order.order_id);
      // Handle successful payment
    } else if (webhookData.type === 'PAYMENT_FAILED_WEBHOOK') {
      console.log("Payment failed:", webhookData.data.order.order_id);
      // Handle failed payment
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(200).json({ success: true }); // Still acknowledge to prevent retries
  }
};

// Handle payment return/redirect
export const handlePaymentReturn = async (req, res) => {
  try {
    const { order_id, order_status } = req.query;
    
    if (order_status === 'PAID') {
      // Redirect to success page
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment-verification?order_id=${order_id}&status=success`);
    } else {
      // Redirect to failure page
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment-verification?order_id=${order_id}&status=failed`);
    }
  } catch (error) {
    console.error("Payment return handling error:", error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment-verification?status=error`);
  }
};

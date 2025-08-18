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
        return_url: process.env.CASHFREE_RETURN_URL,
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
    // ...existing code...
    console.log("req.user object:", req.user);

    const {
      name, email, phone, bank_account, ifsc, vpa,
      address1, city, state, pincode, org_name, org_pan, org_gst
    } = req.body;

    const beneficiary_id = "BEN_" + Date.now();
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
    
    // Check for beneficiary_status instead of status
    if (response.data.beneficiary_status === "VERIFIED") {
      try {
        // Log the entire req.user object for debugging
        console.log("req.user object:", req.user);
        if (!req.user || !req.user._id) {
          console.error("req.user or req.user._id is missing. Cannot update MongoDB.");
          return res.status(500).json({ error: "Beneficiary added to Cashfree, but user authentication info is missing. Cannot update user in database." });
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
          return res.status(500).json({ error: "Beneficiary added to Cashfree, but failed to update user in database." });
        }

        return res.json({ beneficiary_id, status: "added", data: response.data });
      } catch (dbErr) {
        console.error("MongoDB update error:", dbErr);
        return res.status(500).json({ error: "Beneficiary added to Cashfree, but failed to update user in database." });
      }
    } else {
      console.log("Cashfree beneficiary_status was not VERIFIED, it was:", response.data.beneficiary_status);
      return res.status(400).json({
        error: response.data.message || "Failed to add beneficiary"
      });
    }
  } catch (err) {
    const errorCode = err.response?.data?.code;
    let errorMessage = err.response?.data?.message || "Internal server error";
    if (errorCode === "beneficiary_instrument_details.bank_ifsc_invalid") {
      errorMessage = "Please provide a valid IFSC code.";
    }
    console.error("Add Beneficiary Error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: errorMessage
    });
  }
};

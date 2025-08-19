import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createDonationOrder,
  verifyDonationPayment,
  handleDonationWebhook,
  getDonationDetails,
  getDonorHistory,
  getCampaignDonations,
  manualTransferToNGO,
  getSettlementStatus
} from "../controllers/donations.controller.js";

const router = express.Router();

// Create donation order (requires authentication)
router.post("/create-order", protectRoute, createDonationOrder);

// Verify payment status (requires authentication)
router.post("/verify-payment", protectRoute, verifyDonationPayment);

// Webhook endpoint (no authentication required)
router.post("/webhook", handleDonationWebhook);

// Get donation details by order ID (requires authentication)
router.get("/details/:orderId", protectRoute, getDonationDetails);

// Get donor's donation history (requires authentication)
router.get("/history", protectRoute, getDonorHistory);

// Get campaign donations for NGO (requires authentication)
router.get("/campaign/:campaignId", protectRoute, getCampaignDonations);

// Manual transfer to NGO (for retrying failed transfers)
router.post("/transfer/:orderId", protectRoute, manualTransferToNGO);

// Get settlement status for NGO
router.get("/settlements", protectRoute, getSettlementStatus);

export default router;
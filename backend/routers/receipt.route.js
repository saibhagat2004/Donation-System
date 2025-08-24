import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  generateDonationReceipt,
  getReceiptData
} from "../controllers/receipt.controller.js";

const router = express.Router();

// Download PDF receipt (requires authentication)
router.get("/download/:orderId", protectRoute, generateDonationReceipt);

// Get receipt data for preview (requires authentication)
router.get("/data/:orderId", protectRoute, getReceiptData);

export default router;

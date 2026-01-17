import express from "express";
import {
  addTransactionFeedback,
  getTransactionFeedback,
  getNgoReputation,
  getNgoTransactionsWithFeedback,
  checkUserFeedback
} from "../controllers/feedback.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Add feedback to a transaction (authenticated users only)
router.post("/transaction/:transactionId", protectRoute, addTransactionFeedback);

// Get feedback for a transaction (public)
router.get("/transaction/:transactionId", getTransactionFeedback);

// Check if current user has provided feedback for a transaction
router.get("/transaction/:transactionId/check", protectRoute, checkUserFeedback);

// Get NGO reputation (public)
router.get("/ngo/:ngoId/reputation", getNgoReputation);

// Get NGO's transactions with feedback (NGO only)
router.get("/ngo/my-feedback", protectRoute, getNgoTransactionsWithFeedback);

export default router;

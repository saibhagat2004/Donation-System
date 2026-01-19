import PendingTransaction from "../models/pendingTransaction.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Helper function to find transaction by ID or transaction_id or blockchain_tx_id
const findTransaction = async (transactionId) => {
  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(transactionId) && transactionId.length === 24) {
    return await PendingTransaction.findById(transactionId);
  }
  
  // Try to find by transaction_id field (e.g., "PWT_1735383600000_ABC123")
  let transaction = await PendingTransaction.findOne({ transaction_id: transactionId });
  
  // If not found, try to find by blockchain_tx_id (e.g., "95")
  if (!transaction) {
    transaction = await PendingTransaction.findOne({ blockchain_tx_id: transactionId });
  }
  
  return transaction;
};

// Add feedback to a transaction
export const addTransactionFeedback = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { ratingType, comment, reason } = req.body;
    const userId = req.user._id;
    const userName = req.user.fullName || req.user.username || "Anonymous";
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate input
    if (!ratingType || !["THUMBS_UP", "RED_FLAG"].includes(ratingType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid rating type. Must be THUMBS_UP or RED_FLAG" 
      });
    }

    // Find transaction by _id or transaction_id
    const transaction = await findTransaction(transactionId);
    if (transaction) {
      await transaction.populate('ngo_id', 'fullName email');
    }
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: "Transaction not found" 
      });
    }

    // Check if transaction has a document
    if (!transaction.document_url) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot provide feedback on transaction without proof document" 
      });
    }

    // Check if user is the NGO who owns this transaction
    if (transaction.ngo_id._id.toString() === userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "NGOs cannot provide feedback on their own transactions" 
      });
    }

    // Add feedback
    await transaction.addFeedback(userId, userName, ratingType, comment, reason, ipAddress);

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      transaction: {
        id: transaction._id,
        feedback_stats: transaction.feedback_stats
      }
    });
  } catch (error) {
    console.error("Error adding transaction feedback:", error);
    
    if (error.message === 'User has already provided feedback for this transaction') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit feedback",
      error: error.message 
    });
  }
};

// Get feedback for a transaction
export const getTransactionFeedback = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find transaction by _id or transaction_id
    const transaction = await findTransaction(transactionId);
    if (transaction) {
      await transaction.populate('feedback.user_id', 'fullName profilePicture');
    }

    // If transaction not found (e.g., blockchain-only transaction), return empty feedback
    if (!transaction) {
      return res.status(200).json({ 
        success: true,
        feedback: [],
        stats: {
          thumbs_up_count: 0,
          red_flag_count: 0,
          total_feedback_count: 0
        },
        message: "Transaction not found in database. Feedback not available for this transaction."
      });
    }

    res.status(200).json({
      success: true,
      feedback: transaction.feedback || [],
      stats: transaction.feedback_stats || {
        thumbs_up_count: 0,
        red_flag_count: 0,
        total_feedback_count: 0
      }
    });
  } catch (error) {
    console.error("Error fetching transaction feedback:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedback",
      error: error.message 
    });
  }
};

// Get NGO reputation
export const getNgoReputation = async (req, res) => {
  try {
    const { ngoId } = req.params;

    const ngo = await User.findById(ngoId).select('fullName reputation ngoDetails');

    if (!ngo) {
      return res.status(404).json({ 
        success: false, 
        message: "NGO not found" 
      });
    }

    if (ngo.role !== 'ngo') {
      return res.status(400).json({ 
        success: false, 
        message: "User is not an NGO" 
      });
    }

    res.status(200).json({
      success: true,
      ngo: {
        id: ngo._id,
        fullName: ngo.fullName,
        orgName: ngo.ngoDetails?.org_name,
        reputation: ngo.reputation || {
          thumbsUpCount: 0,
          redFlagCount: 0,
          totalFeedbackCount: 0,
          reputationScore: 0
        }
      }
    });
  } catch (error) {
    console.error("Error fetching NGO reputation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch NGO reputation",
      error: error.message 
    });
  }
};

// Get all transactions with feedback for an NGO (for NGO dashboard)
export const getNgoTransactionsWithFeedback = async (req, res) => {
  try {
    const ngoId = req.user._id;

    // Verify user is an NGO
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. NGO role required" 
      });
    }

    const transactions = await PendingTransaction.find({ 
      ngo_id: ngoId,
      'feedback.0': { $exists: true } // Only transactions with at least one feedback
    })
    .select('transaction_id amount cause document_url feedback feedback_stats createdAt')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("Error fetching NGO transactions with feedback:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch transactions",
      error: error.message 
    });
  }
};

// Check if user has already provided feedback for a transaction
export const checkUserFeedback = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    // Find transaction by _id or transaction_id
    const transaction = await findTransaction(transactionId);

    // If transaction not found (e.g., blockchain-only transaction), return no feedback
    if (!transaction) {
      return res.status(200).json({ 
        success: true,
        hasFeedback: false,
        feedback: null,
        message: "Transaction not found in database"
      });
    }

    const userFeedback = transaction.feedback.find(
      f => f.user_id.toString() === userId.toString()
    );

    res.status(200).json({
      success: true,
      hasFeedback: !!userFeedback,
      feedback: userFeedback || null
    });
  } catch (error) {
    console.error("Error checking user feedback:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check feedback",
      error: error.message 
    });
  }
};

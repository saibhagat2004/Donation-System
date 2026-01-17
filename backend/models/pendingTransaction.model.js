import mongoose from "mongoose";

const pendingTransactionSchema = new mongoose.Schema(
  {
    // Core transaction info
    transaction_id: {
      type: String,
      trim: true
    },
    ngo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ngo_account_number: {
      type: String,
      required: true,
      trim: true
    },
    
    // Transaction details
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: function(value) {
          return Number.isInteger(value * 100); // Ensure max 2 decimal places
        },
        message: "Amount can have maximum 2 decimal places"
      }
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"]
    },
    
    // Withdrawal info
    withdrawal_type: {
      type: String,
      enum: ["CASH_WITHDRAWAL", "TRANSFER", "PAYMENT", "OTHER"],
      default: "CASH_WITHDRAWAL"
    },
    cause: {
      type: String,
      trim: true,
      maxLength: 200
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500
    },
    
    // Bank transaction details
    bank_transaction_id: {
      type: String,
      trim: true
    },
    bank_reference: {
      type: String,
      trim: true
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ["PENDING", "DOCUMENT_UPLOADED", "RECORDED", "EXPIRED", "CANCELLED"],
      default: "PENDING",
      required: true
    },
    
    // Document upload info
    document_upload_deadline: {
      type: Date
    },
    document_url: {
      type: String,
      trim: true
    },
    document_hash: {
      type: String,
      trim: true
    },
    document_uploaded_at: {
      type: Date
    },
    
    // Verification hash for blockchain
    verification_hash: {
      type: String,
      trim: true
    },
    
    // Blockchain recording info
    blockchain_tx_id: {
      type: String,
      trim: true
    },
    blockchain_recorded_at: {
      type: Date
    },
    
    // Notification tracking
    notification_sent: {
      type: Boolean,
      default: false
    },
    notification_sent_at: {
      type: Date
    },
    reminder_count: {
      type: Number,
      default: 0,
      min: 0
    },
    last_reminder_at: {
      type: Date
    },
    
    // Metadata
    initiated_by: {
      type: String,
      default: "BANK_API",
      enum: ["BANK_API", "MANUAL", "SYSTEM"]
    },
    ip_address: {
      type: String,
      trim: true
    },
    
    // Notes and comments
    admin_notes: {
      type: String,
      trim: true,
      maxLength: 1000
    },
    ngo_notes: {
      type: String,
      trim: true,
      maxLength: 500
    },
    
    // Public feedback from donors/users
    feedback: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      user_name: {
        type: String,
        trim: true
      },
      rating_type: {
        type: String,
        enum: ["THUMBS_UP", "RED_FLAG"],
        required: true
      },
      comment: {
        type: String,
        trim: true,
        maxLength: 500
      },
      reason: {
        type: String,
        enum: [
          "PROOF_APPROPRIATE",
          "PROOF_INSUFFICIENT",
          "PROOF_FAKE",
          "SUSPICIOUS_ACTIVITY",
          "GOOD_TRANSPARENCY",
          "WELL_DOCUMENTED",
          "OTHER"
        ],
        trim: true
      },
      created_at: {
        type: Date,
        default: Date.now
      },
      ip_address: {
        type: String,
        trim: true
      }
    }],
    
    // Feedback statistics
    feedback_stats: {
      thumbs_up_count: {
        type: Number,
        default: 0,
        min: 0
      },
      red_flag_count: {
        type: Number,
        default: 0,
        min: 0
      },
      total_feedback_count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Expiry handling
    expired_at: {
      type: Date
    },
    expiry_reason: {
      type: String,
      enum: ["TIMEOUT", "NGO_CANCELLED", "ADMIN_CANCELLED", "SYSTEM_ERROR"],
      trim: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
pendingTransactionSchema.virtual('is_expired').get(function() {
  return new Date() > this.document_upload_deadline && this.status === 'PENDING';
});

pendingTransactionSchema.virtual('time_remaining').get(function() {
  if (this.status !== 'PENDING') return 0;
  const now = new Date();
  const deadline = this.document_upload_deadline;
  return Math.max(0, Math.floor((deadline - now) / 1000)); // seconds remaining
});

pendingTransactionSchema.virtual('minutes_remaining').get(function() {
  return Math.floor(this.time_remaining / 60);
});

pendingTransactionSchema.virtual('has_document').get(function() {
  return !!(this.document_url && this.document_hash);
});

// Pre-save middleware
pendingTransactionSchema.pre('save', function(next) {
  // Auto-generate transaction ID if not provided
  if (!this.transaction_id) {
    const timestamp = Date.now().toString();
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transaction_id = `PWT_${timestamp}_${randomId}`;
  }
  
  // Set document upload deadline (1.5 minutes from creation for demo, 1 day for production)
  if (this.isNew && !this.document_upload_deadline) {
    const uploadWindow = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 90 * 1000; // 24 hours or 90 seconds (1.5 minutes)
    this.document_upload_deadline = new Date(Date.now() + uploadWindow);
  }
  
  // Update status based on conditions
  if (this.document_url && this.status === 'PENDING') {
    this.status = 'DOCUMENT_UPLOADED';
    this.document_uploaded_at = new Date();
  }
  
  // Handle expiry
  if (this.is_expired && this.status === 'PENDING') {
    this.status = 'EXPIRED';
    this.expired_at = new Date();
    this.expiry_reason = 'TIMEOUT';
  }
  
  // Update feedback statistics
  if (this.feedback && this.feedback.length > 0) {
    const thumbsUpCount = this.feedback.filter(f => f.rating_type === 'THUMBS_UP').length;
    const redFlagCount = this.feedback.filter(f => f.rating_type === 'RED_FLAG').length;
    
    this.feedback_stats = {
      thumbs_up_count: thumbsUpCount,
      red_flag_count: redFlagCount,
      total_feedback_count: this.feedback.length
    };
  }
  
  next();
});

// Post-save middleware for notifications
pendingTransactionSchema.post('save', async function(transaction) {
  // Send notification for new pending transactions
  if (transaction.isNew && transaction.status === 'PENDING' && !transaction.notification_sent) {
    try {
      // Import services dynamically to avoid circular dependencies
      const [{ default: notificationService }, { default: User }] = await Promise.all([
        import('../services/notificationService.js'),
        import('./user.model.js')
      ]);

      // Get NGO details
      const ngo = await User.findById(transaction.ngo_id);
      if (ngo) {
        // Send withdrawal notification
        const notificationResult = await notificationService.sendWithdrawalNotification(ngo, transaction);
        
        if (notificationResult.success) {
          console.log(`✅ Withdrawal notification sent for transaction ${transaction.transaction_id}`);
          
          // Mark notification as sent
          await this.model('PendingTransaction').findByIdAndUpdate(
            transaction._id,
            { 
              notification_sent: true,
              notification_sent_at: new Date()
            }
          );
        } else {
          console.error(`❌ Failed to send notification: ${notificationResult.error}`);
        }
      } else {
        console.error(`❌ NGO not found for transaction ${transaction.transaction_id}`);
      }
    } catch (error) {
      console.error('❌ Error in notification post-save middleware:', error);
    }
  }
});

// Indexes for better performance
pendingTransactionSchema.index({ ngo_id: 1, status: 1, createdAt: -1 });
pendingTransactionSchema.index({ ngo_account_number: 1, status: 1 });
pendingTransactionSchema.index({ transaction_id: 1 }, { unique: true });
pendingTransactionSchema.index({ document_upload_deadline: 1, status: 1 });
pendingTransactionSchema.index({ status: 1, createdAt: -1 });

// Static methods
pendingTransactionSchema.statics.findExpiredTransactions = function() {
  return this.find({
    status: 'PENDING',
    document_upload_deadline: { $lt: new Date() }
  });
};

pendingTransactionSchema.statics.findPendingForNgo = function(ngoId) {
  return this.find({
    ngo_id: ngoId,
    status: { $in: ['PENDING', 'DOCUMENT_UPLOADED'] }
  }).sort({ createdAt: -1 });
};

pendingTransactionSchema.statics.countPendingForNgo = function(ngoId) {
  return this.countDocuments({
    ngo_id: ngoId,
    status: 'PENDING'
  });
};

// Add feedback to a transaction
pendingTransactionSchema.methods.addFeedback = async function(userId, userName, ratingType, comment, reason, ipAddress) {
  // Check if user already gave feedback
  const existingFeedback = this.feedback.find(f => f.user_id.toString() === userId.toString());
  
  if (existingFeedback) {
    throw new Error('User has already provided feedback for this transaction');
  }
  
  // Add new feedback
  this.feedback.push({
    user_id: userId,
    user_name: userName,
    rating_type: ratingType,
    comment: comment,
    reason: reason,
    ip_address: ipAddress,
    created_at: new Date()
  });
  
  await this.save();
  
  // Update NGO reputation
  await this.updateNgoReputation();
  
  return this;
};

// Update NGO reputation based on all their transactions
pendingTransactionSchema.methods.updateNgoReputation = async function() {
  try {
    const User = mongoose.model('User');
    
    // Get all transactions for this NGO
    const allTransactions = await this.constructor.find({ ngo_id: this.ngo_id });
    
    // Calculate total feedback across all transactions
    let totalThumbsUp = 0;
    let totalRedFlags = 0;
    let totalFeedback = 0;
    
    allTransactions.forEach(transaction => {
      if (transaction.feedback_stats) {
        totalThumbsUp += transaction.feedback_stats.thumbs_up_count || 0;
        totalRedFlags += transaction.feedback_stats.red_flag_count || 0;
        totalFeedback += transaction.feedback_stats.total_feedback_count || 0;
      }
    });
    
    // Calculate reputation score (0-100)
    let reputationScore = 0;
    if (totalFeedback > 0) {
      reputationScore = Math.round((totalThumbsUp / totalFeedback) * 100);
    }
    
    // Update NGO user record
    await User.findByIdAndUpdate(
      this.ngo_id,
      {
        reputation: {
          thumbsUpCount: totalThumbsUp,
          redFlagCount: totalRedFlags,
          totalFeedbackCount: totalFeedback,
          reputationScore: reputationScore
        }
      }
    );
    
    console.log(`✅ Updated reputation for NGO ${this.ngo_id}: Score ${reputationScore}%`);
  } catch (error) {
    console.error('❌ Error updating NGO reputation:', error);
  }
};

const PendingTransaction = mongoose.model("PendingTransaction", pendingTransactionSchema);

export default PendingTransaction;
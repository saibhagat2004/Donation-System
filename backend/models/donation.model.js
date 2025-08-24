import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    // Core donation info
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: function(value) {
          return Number.isInteger(value * 100); // Ensure max 2 decimal places
        },
        message: "Amount can have maximum 2 decimal places"
      }
    },
    total_amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: function(value) {
          return Number.isInteger(value * 100); // Ensure max 2 decimal places
        },
        message: "Total amount can have maximum 2 decimal places"
      }
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR"]
    },
    
    // References
    donor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true
    },
    ngo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // NGO user who created the campaign
      required: true
    },
    
    // Cashfree Payment Gateway Integration
    cashfree_order_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    payment_session_id: {
      type: String,
      required: true,
      trim: true
    },
    cf_payment_id: {
      type: String, // Cashfree's internal payment ID
      trim: true,
      sparse: true // Allows multiple null values but unique non-null values
    },
    
    // Payment Status
    payment_status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
      required: true
    },
    payment_method: {
      type: String,
      enum: ["UPI", "NETBANKING", "CARD", "WALLET", "EMI", "OTHER"],
      trim: true
    },
    
    // NGO Beneficiary Info (for direct settlement)
    beneficiary_id: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(value) {
          return value.startsWith('BEN_');
        },
        message: "Beneficiary ID must start with 'BEN_'"
      }
    },
    
    // Settlement Info
    settlement_status: {
      type: String,
      enum: ["PENDING", "SETTLED", "FAILED"],
      default: "PENDING"
    },
    settlement_id: {
      type: String,
      trim: true
    },
    settled_at: {
      type: Date
    },
    settlement_amount: {
      type: Number,
      min: 0
    },
    settlement_notes: {
      type: String,
      trim: true,
      maxLength: 500
    },
    
    // Transaction Details
    payment_gateway_fee: {
      type: Number,
      default: 0,
      min: 0
    },
    platform_fee: {
      type: Number,
      default: 0,
      min: 0
    },
    net_amount: {
      type: Number, // Amount after deducting fees
      min: 0
    },
    
    // Donor Preferences
    anonymous: {
      type: Boolean,
      default: false
    },
    show_amount: {
      type: Boolean,
      default: true
    },
    donor_message: {
      type: String,
      trim: true,
      maxLength: 500
    },
    
    // Timestamps
    initiated_at: {
      type: Date,
      default: Date.now
    },
    paid_at: {
      type: Date
    },
    failed_at: {
      type: Date
    },
    
    // Additional Info
    payment_link: {
      type: String,
      trim: true
    },
    failure_reason: {
      type: String,
      trim: true
    },
    
    // Cashfree Webhook Data
    webhook_data: {
      type: mongoose.Schema.Types.Mixed, // Store raw webhook response
      default: {}
    },
    
    // Receipt and Tax
    receipt_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    tax_deduction_eligible: {
      type: Boolean,
      default: true
    },
    
    // Refund Info
    refund_status: {
      type: String,
      enum: ["NOT_APPLICABLE", "PENDING", "PROCESSED", "FAILED"],
      default: "NOT_APPLICABLE"
    },
    refund_id: {
      type: String,
      trim: true
    },
    refunded_amount: {
      type: Number,
      min: 0,
      default: 0
    },
    refund_reason: {
      type: String,
      trim: true
    },
    refunded_at: {
      type: Date
    },
    
    // Metadata
    ip_address: {
      type: String,
      trim: true
    },
    user_agent: {
      type: String,
      trim: true
    },
    device_info: {
      platform: String,
      browser: String,
      os: String
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
donationSchema.virtual('is_successful').get(function() {
  return this.payment_status === 'PAID';
});

donationSchema.virtual('is_pending').get(function() {
  return this.payment_status === 'PENDING';
});

donationSchema.virtual('processing_time').get(function() {
  if (this.paid_at && this.initiated_at) {
    return Math.round((this.paid_at - this.initiated_at) / 1000); // in seconds
  }
  return null;
});

// Pre-save middleware
donationSchema.pre('save', function(next) {
  // In the new model: amount = donation to NGO, total_amount = what donor pays
  // net_amount should equal amount (donation to NGO)
  if (this.amount && !this.net_amount) {
    this.net_amount = this.amount; // Net amount to NGO equals donation amount
  }
  
  // Generate receipt number for successful payments
  if (this.payment_status === 'PAID' && !this.receipt_number) {
    this.receipt_number = `RCP_${Date.now()}_${this._id}`;
  }
  
  // Set paid_at timestamp
  if (this.payment_status === 'PAID' && !this.paid_at) {
    this.paid_at = new Date();
  }
  
  // Set failed_at timestamp
  if (this.payment_status === 'FAILED' && !this.failed_at) {
    this.failed_at = new Date();
  }
  
  next();
});

// Post-save middleware to update campaign stats
donationSchema.post('save', async function(donation) {
  if (donation.payment_status === 'PAID') {
    try {
      const Campaign = mongoose.model('Campaign');
      await Campaign.findByIdAndUpdate(
        donation.campaign_id,
        {
          $inc: { 
            current_amount: donation.amount,
            total_donors: 1
          },
          $push: {
            donors: {
              user_id: donation.donor_id,
              amount: donation.amount,
              donated_at: donation.paid_at,
              payment_id: donation.cashfree_order_id,
              anonymous: donation.anonymous
            }
          }
        }
      );
    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  }
});

// Indexes for better query performance
donationSchema.index({ donor_id: 1, createdAt: -1 });
donationSchema.index({ campaign_id: 1, payment_status: 1 });
donationSchema.index({ ngo_id: 1, payment_status: 1 });
// cashfree_order_id index is already created by unique: true in field definition
donationSchema.index({ payment_status: 1, createdAt: -1 });
donationSchema.index({ settlement_status: 1 });
donationSchema.index({ paid_at: -1 });

// Static methods
donationSchema.statics.getTotalDonations = function(campaignId) {
  return this.aggregate([
    {
      $match: {
        campaign_id: new mongoose.Types.ObjectId(campaignId),
        payment_status: 'PAID'
      }
    },
    {
      $group: {
        _id: null,
        total_amount: { $sum: '$amount' },
        total_donors: { $sum: 1 }
      }
    }
  ]);
};

donationSchema.statics.getDonorStats = function(donorId) {
  return this.aggregate([
    {
      $match: {
        donor_id: new mongoose.Types.ObjectId(donorId),
        payment_status: { $in: ['PAID', 'SUCCESS'] } // Handle both possible status values
      }
    },
    {
      $group: {
        _id: null,
        total_amount: { $sum: '$amount' },
        campaigns_supported: { $addToSet: '$campaign_id' },
        total_donations: { $sum: 1 },
        first_donation: { $min: '$paid_at' },
        last_donation: { $max: '$paid_at' }
      }
    },
    {
      $project: {
        total_amount: 1,
        campaigns_supported: { $size: '$campaigns_supported' },
        total_donations: 1,
        average_amount: { 
          $cond: [
            { $gt: ['$total_donations', 0] },
            { $divide: ['$total_amount', '$total_donations'] },
            0
          ]
        },
        first_donation: 1,
        last_donation: 1
      }
    }
  ]);
};

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
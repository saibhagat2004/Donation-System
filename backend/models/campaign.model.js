import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 2000
    },
    goal_amount: {
      type: Number,
      required: true,
      min: 1
    },
    current_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Education",
        "Healthcare", 
        "Disaster Relief",
        "Child Welfare",
        "Women Empowerment",
        "Environment",
        "Animal Welfare",
        "Poverty Alleviation",
        "Elderly Care",
        "Other"
      ]
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.start_date;
        },
        message: "End date must be after start date"
      }
    },
    location: {
      type: String,
      trim: true,
      maxLength: 100
    },
    contact_person: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100
    },
    contact_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
    },
    contact_phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"]
    },
    beneficiary_details: {
      type: String,
      trim: true,
      maxLength: 1000
    },
    campaign_status: {
      type: String,
      enum: ["active", "inactive", "completed", "paused"],
      default: "active"
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags) {
          return tags.length <= 10; // Maximum 10 tags
        },
        message: "Maximum 10 tags allowed"
      }
    },
    // Image file paths/URLs
    logo: {
      type: String, // Will store file path or URL
      default: ""
    },
    activity_photos: {
      type: [String], // Array of file paths or URLs
      default: [],
      validate: {
        validator: function(photos) {
          return photos.length <= 20; // Maximum 20 photos
        },
        message: "Maximum 20 activity photos allowed"
      }
    },
    // Campaign creator (NGO user)
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // NGO Beneficiary ID from Cashfree for direct payments
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
    // Donation tracking
    donors: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      amount: {
        type: Number,
        required: true,
        min: 1
      },
      donated_at: {
        type: Date,
        default: Date.now
      },
      payment_id: String, // Reference to payment transaction
      anonymous: {
        type: Boolean,
        default: false
      }
    }],
    // Campaign metrics
    total_donors: {
      type: Number,
      default: 0
    },
    progress_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Campaign verification status
    verified: {
      type: Boolean,
      default: false
    },
    verification_notes: {
      type: String,
      trim: true
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    verified_at: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted tags (convert array to comma-separated string for frontend)
campaignSchema.virtual('formatted_tags').get(function() {
  return this.tags.join(', ');
});

// Virtual for days remaining
campaignSchema.virtual('days_remaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.end_date);
  const timeDiff = endDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff > 0 ? daysDiff : 0;
});

// Virtual for campaign status based on dates
campaignSchema.virtual('is_active').get(function() {
  const now = new Date();
  const startDate = new Date(this.start_date);
  const endDate = new Date(this.end_date);
  return now >= startDate && now <= endDate && this.campaign_status === 'active';
});

// Pre-save middleware to process tags
campaignSchema.pre('save', function(next) {
  // Convert comma-separated tags string to array and clean up
  if (typeof this.tags === 'string') {
    this.tags = this.tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }
  
  // Calculate progress percentage
  if (this.goal_amount > 0) {
    this.progress_percentage = Math.min(
      Math.round((this.current_amount / this.goal_amount) * 100),
      100
    );
  }
  
  next();
});

// Index for better query performance
campaignSchema.index({ category: 1, campaign_status: 1 });
campaignSchema.index({ created_by: 1 });
campaignSchema.index({ start_date: 1, end_date: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ verified: 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;

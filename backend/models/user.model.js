import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows Google users to sign up without a username
    },
    fullName: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      minLength: 6,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows users to sign up with Google without conflicts
    },
    role: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: function () {
        // Only NGOs get verified field, default false
        return this.role === "NGO" ? false : undefined;
      },
    },
    ngoDetails: {
      type: {
        beneficiary_id: String,
        name: String,
        email: String,
        phone: String,
        bank_account: String,
        ifsc: String,
        vpa: String,
        address1: String,
        city: String,
        state: String,
        pincode: String,
        org_name: String,
        org_pan: String,
        org_gst: String
      },
      default: undefined
    },
    // Reputation & feedback tracking for NGOs
    reputation: {
      thumbsUpCount: {
        type: Number,
        default: 0,
        min: 0
      },
      redFlagCount: {
        type: Number,
        default: 0,
        min: 0
      },
      totalFeedbackCount: {
        type: Number,
        default: 0,
        min: 0
      },
      reputationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;

import { Cashfree } from "cashfree-pg";
import crypto from "crypto";
import axios from "axios";
import Donation from "../models/donation.model.js";
import Campaign from "../models/campaign.model.js";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

// Generate unique order ID for donations
function generateDonationOrderId() {
  return `DON_${crypto.randomBytes(12).toString("hex")}`;
}

// Transfer funds to NGO beneficiary account
export const transferToNGO = async (donationId) => {
  try {
    const donation = await Donation.findById(donationId)
      .populate('ngo_id')
      .populate('campaign_id');
    
    if (!donation || donation.payment_status !== 'PAID') {
      throw new Error('Invalid donation for transfer');
    }

    if (donation.settlement_status === 'SETTLED') {
      console.log('Donation already settled');
      return;
    }

    // Cashfree Payout API call
    const transferPayload = {
      transfer_id: `TXN_${Date.now()}_${donation._id}`,
      transfer_amount: donation.net_amount, // Amount after deducting fees
      beneficiary_id: donation.beneficiary_id,
      transfer_mode: "banktransfer",
      remarks: `Donation settlement for: ${donation.campaign_id.title}`
    };

    const headers = {
      "x-client-id": process.env.CASHFREE_PAYOUT_CLIENT_ID,
      "x-client-secret": process.env.CASHFREE_PAYOUT_CLIENT_SECRET,
      "x-api-version": process.env.CASHFREE_PAYOUT_API_VERSION,
      "Content-Type": "application/json"
    };

    // Cashfree Payout API endpoint
    const payoutUrl = process.env.CASHFREE_ENV === 'SANDBOX' 
      ? "https://sandbox.cashfree.com/payout/transfers"
      : "https://api.cashfree.com/payout/transfers";

    console.log(`🔄 Initiating transfer to NGO: ₹${donation.net_amount} to ${donation.beneficiary_id}`);

    const response = await axios.post(payoutUrl, transferPayload, { headers });

    // Update donation record with settlement info
    await Donation.findByIdAndUpdate(donationId, {
      settlement_status: "SETTLED",
      settlement_id: response.data.transfer_id,
      settlement_amount: donation.net_amount,
      settled_at: new Date()
    });

    console.log(`✅ NGO transfer successful: ${response.data.transfer_id}`);
    console.log(`💰 Amount: ₹${donation.net_amount} transferred to ${donation.beneficiary_id}`);
    
    return response.data;

  } catch (error) {
    console.error('❌ NGO transfer failed:', error.response?.data || error.message);
    
    // Update settlement status to failed
    await Donation.findByIdAndUpdate(donationId, {
      settlement_status: "FAILED",
      failure_reason: error.response?.data?.message || error.message
    });
    
    throw error;
  }
};

// Calculate platform and gateway fees
function calculateFees(amount) {
  const platformFeePercentage = 1.5; // 2.5% platform fee
  const gatewayFeePercentage = 1.36; // Cashfree's fee (approximate)
  
  const platformFee = Math.round((amount * platformFeePercentage) / 100);
  const gatewayFee = Math.round((amount * gatewayFeePercentage) / 100);
  
  return {
    platformFee,
    gatewayFee,
    netAmount: amount - platformFee - gatewayFee
  };
}

// Create donation order
export const createDonationOrder = async (req, res) => {
  try {
    const { campaignId, amount, donorInfo, preferences } = req.body;
    const userId = req.user._id; // Donor ID from auth middleware

    // Validate required fields
    if (!campaignId || !amount || !donorInfo) {
      return res.status(400).json({ 
        error: "Campaign ID, amount, and donor information are required" 
      });
    }

    if (amount < 1) {
      return res.status(400).json({ 
        error: "Minimum donation amount is ₹1" 
      });
    }

    // Fetch campaign details
    const campaign = await Campaign.findById(campaignId).populate('created_by');
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Check if campaign is active
    const now = new Date();
    if (campaign.end_date < now) {
      return res.status(400).json({ error: "Campaign has ended" });
    }

    // Get NGO details for beneficiary_id
    const ngo = campaign.created_by;
    if (!ngo.ngoDetails || !ngo.ngoDetails.beneficiary_id) {
      return res.status(400).json({ 
        error: "NGO beneficiary details not found. Please contact the campaign organizer." 
      });
    }

    // Calculate fees
    const { platformFee, gatewayFee, netAmount } = calculateFees(amount);

    // Generate order ID
    const orderLd = generateDonationOrderId();

    // Create Cashfree order request
    const cashfreeRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderLd,
      customer_details: {
        customer_id: userId.toString(),
        customer_phone: donorInfo.phone,
        customer_name: donorInfo.name,
        customer_email: donorInfo.email,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/donation-success`,
        notify_url: `${process.env.BACKEND_URL}/api/donations/webhook`,
        campaign_id: campaignId,
        donor_id: userId.toString()
      },
      order_note: `Donation for ${campaign.title}`
    };

    // Create order in Cashfree
    const cashfreeResponse = await cashfree.PGCreateOrder(cashfreeRequest);
    
    if (!cashfreeResponse.data) {
      throw new Error("Failed to create payment order");
    }

    // Create donation record in database
    const donation = new Donation({
      amount: amount,
      donor_id: userId,
      campaign_id: campaignId,
      ngo_id: ngo._id,
      cashfree_order_id: orderLd,
      payment_session_id: cashfreeResponse.data.payment_session_id,
      beneficiary_id: ngo.ngoDetails.beneficiary_id,
      payment_gateway_fee: gatewayFee,
      platform_fee: platformFee,
      net_amount: netAmount,
      anonymous: preferences?.anonymous || false,
      show_amount: preferences?.showAmount !== false,
      donor_message: preferences?.donorMessage || "",
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      device_info: {
        platform: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop'
      }
    });

    await donation.save();

    return res.json({
      success: true,
      order_id: orderLd,
      payment_session_id: cashfreeResponse.data.payment_session_id,
      amount: amount,
      currency: "INR",
      fees: {
        platform_fee: platformFee,
        gateway_fee: gatewayFee,
        net_amount: netAmount
      }
    });

  } catch (error) {
    console.error("Create donation order error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to create donation order" 
    });
  }
};

// Verify payment status
export const verifyDonationPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get payment status from Cashfree
    const cashfreeResponse = await cashfree.PGFetchOrder(orderId);
    
    if (!cashfreeResponse.data) {
      throw new Error("Failed to fetch order status");
    }

    const paymentData = cashfreeResponse.data;
    
    // Find donation in database
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    }).populate('campaign_id donor_id');

    if (!donation) {
      return res.status(404).json({ error: "Donation record not found" });
    }

    // Update donation status based on Cashfree response
    let updateData = {
      webhook_data: paymentData,
      payment_method: paymentData.payment_method?.replace(/_/g, '').toUpperCase() || "OTHER"
    };

    if (paymentData.order_status === "PAID") {
      updateData.payment_status = "PAID";
      updateData.cf_payment_id = paymentData.cf_payment_id;
      updateData.paid_at = new Date();
      
      // Update donation record first
      const updatedDonation = await Donation.findByIdAndUpdate(
        donation._id,
        updateData,
        { new: true }
      );

      // 🚀 AUTO-TRANSFER TO NGO IMMEDIATELY AFTER PAYMENT SUCCESS
      try {
        console.log(`🔄 Starting auto-transfer for donation: ${updatedDonation._id}`);
        await transferToNGO(updatedDonation._id);
        console.log(`✅ Auto-transfer completed successfully`);
      } catch (transferError) {
        console.error('⚠️ Auto-transfer to NGO failed:', transferError.message);
        // Don't fail the main payment verification, but log the error
        // The transfer can be retried later
      }

      return res.json({
        success: true,
        payment_status: "PAID",
        order_id: orderId,
        amount: donation.amount,
        net_amount: donation.net_amount,
        campaign_title: donation.campaign_id.title,
        message: "Payment successful! Funds are being transferred to the NGO."
      });

    } else if (paymentData.order_status === "FAILED") {
      updateData.payment_status = "FAILED";
      updateData.failure_reason = paymentData.failure_reason || "Payment failed";
      updateData.failed_at = new Date();

      await Donation.findByIdAndUpdate(donation._id, updateData);

      return res.json({
        success: false,
        payment_status: "FAILED",
        order_id: orderId,
        message: "Payment failed. Please try again."
      });

    } else if (paymentData.order_status === "CANCELLED") {
      updateData.payment_status = "CANCELLED";
      updateData.failed_at = new Date();

      await Donation.findByIdAndUpdate(donation._id, updateData);

      return res.json({
        success: false,
        payment_status: "CANCELLED",
        order_id: orderId,
        message: "Payment was cancelled."
      });

    } else {
      // PENDING status
      await Donation.findByIdAndUpdate(donation._id, updateData);

      return res.json({
        success: true,
        payment_status: "PENDING",
        order_id: orderId,
        message: "Payment is being processed..."
      });
    }

  } catch (error) {
    console.error("Verify donation payment error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to verify payment" 
    });
  }
};

// Handle Cashfree webhooks
export const handleDonationWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Verify webhook signature (implement based on Cashfree documentation)
    // const signature = req.headers['x-cashfree-signature'];
    // if (!verifyWebhookSignature(webhookData, signature)) {
    //   return res.status(400).json({ error: "Invalid webhook signature" });
    // }

    const orderId = webhookData.order_id;
    
    if (!orderId) {
      return res.status(400).json({ error: "Order ID not found in webhook" });
    }

    // Find donation
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    });

    if (!donation) {
      console.error(`Webhook received for unknown order: ${orderId}`);
      return res.status(404).json({ error: "Donation not found" });
    }

    // Update donation based on webhook data
    let updateData = {
      webhook_data: webhookData,
      payment_method: webhookData.payment_method?.replace(/_/g, '').toUpperCase() || "OTHER"
    };

    if (webhookData.order_status === "PAID") {
      updateData.payment_status = "PAID";
      updateData.cf_payment_id = webhookData.cf_payment_id;
      updateData.paid_at = new Date();

      // Update donation record first
      const updatedDonation = await Donation.findByIdAndUpdate(donation._id, updateData, { new: true });

      // 🚀 AUTO-TRANSFER TO NGO VIA WEBHOOK
      try {
        console.log(`🔄 Webhook: Starting auto-transfer for donation: ${updatedDonation._id}`);
        await transferToNGO(updatedDonation._id);
        console.log(`✅ Webhook: Auto-transfer completed successfully`);
      } catch (transferError) {
        console.error('⚠️ Webhook: Auto-transfer to NGO failed:', transferError.message);
        // Log the error but don't fail the webhook response
      }

    } else if (webhookData.order_status === "FAILED") {
      updateData.payment_status = "FAILED";
      updateData.failure_reason = webhookData.failure_reason || "Payment failed";
      updateData.failed_at = new Date();

      await Donation.findByIdAndUpdate(donation._id, updateData);
    } else {
      await Donation.findByIdAndUpdate(donation._id, updateData);
    }

    console.log(`Webhook processed for order ${orderId}: ${webhookData.order_status}`);
    
    return res.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Get donation details
export const getDonationDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    }).populate('campaign_id donor_id ngo_id');

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    // Only allow donor or NGO to view donation details
    const userId = req.user._id.toString();
    if (donation.donor_id._id.toString() !== userId && 
        donation.ngo_id._id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json({
      success: true,
      donation: {
        order_id: donation.cashfree_order_id,
        amount: donation.amount,
        status: donation.payment_status,
        campaign: {
          id: donation.campaign_id._id,
          title: donation.campaign_id.title,
          category: donation.campaign_id.category
        },
        donor: donation.anonymous ? null : {
          name: donation.donor_id.fullName,
          message: donation.donor_message
        },
        created_at: donation.initiated_at,
        paid_at: donation.paid_at,
        receipt_number: donation.receipt_number,
        fees: {
          platform_fee: donation.platform_fee,
          gateway_fee: donation.payment_gateway_fee,
          net_amount: donation.net_amount
        }
      }
    });

  } catch (error) {
    console.error("Get donation details error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch donation details" 
    });
  }
};

// Get donor's donation history
export const getDonorHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ 
      donor_id: userId 
    })
    .populate('campaign_id', 'title category logo current_amount goal_amount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalDonations = await Donation.countDocuments({ 
      donor_id: userId 
    });

    // Get donor statistics
    const stats = await Donation.getDonorStats(userId);

    return res.json({
      success: true,
      donations: donations.map(donation => ({
        order_id: donation.cashfree_order_id,
        amount: donation.amount,
        status: donation.payment_status,
        campaign: {
          id: donation.campaign_id._id,
          title: donation.campaign_id.title,
          category: donation.campaign_id.category,
          logo: donation.campaign_id.logo
        },
        donated_at: donation.paid_at || donation.initiated_at,
        receipt_number: donation.receipt_number
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalDonations / limit),
        total_donations: totalDonations,
        has_more: skip + donations.length < totalDonations
      },
      stats: stats[0] || {
        total_donated: 0,
        campaigns_count: 0,
        first_donation: null,
        last_donation: null
      }
    });

  } catch (error) {
    console.error("Get donor history error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch donation history" 
    });
  }
};

// Get campaign donations (for NGO)
export const getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify NGO owns this campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.created_by.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const donations = await Donation.find({ 
      campaign_id: campaignId,
      payment_status: "PAID"
    })
    .populate('donor_id', 'fullName email')
    .sort({ paid_at: -1 })
    .skip(skip)
    .limit(limit);

    const totalDonations = await Donation.countDocuments({ 
      campaign_id: campaignId,
      payment_status: "PAID"
    });

    return res.json({
      success: true,
      donations: donations.map(donation => ({
        order_id: donation.cashfree_order_id,
        amount: donation.amount,
        donor: donation.anonymous ? "Anonymous" : {
          name: donation.donor_id.fullName,
          email: donation.donor_id.email
        },
        message: donation.donor_message,
        donated_at: donation.paid_at,
        receipt_number: donation.receipt_number,
        show_amount: donation.show_amount,
        settlement_status: donation.settlement_status
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalDonations / limit),
        total_donations: totalDonations,
        has_more: skip + donations.length < totalDonations
      }
    });

  } catch (error) {
    console.error("Get campaign donations error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch campaign donations" 
    });
  }
};

// Manual transfer to NGO (for retrying failed transfers)
export const manualTransferToNGO = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find donation
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    }).populate('campaign_id ngo_id');

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    // Check if user is the NGO owner or admin
    const userId = req.user._id.toString();
    if (donation.ngo_id._id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if donation is paid but not settled
    if (donation.payment_status !== "PAID") {
      return res.status(400).json({ error: "Donation is not paid yet" });
    }

    if (donation.settlement_status === "SETTLED") {
      return res.status(400).json({ error: "Donation already settled" });
    }

    // Attempt transfer
    const transferResult = await transferToNGO(donation._id);

    return res.json({
      success: true,
      message: "Transfer initiated successfully",
      transfer_id: transferResult.transfer_id,
      amount: donation.net_amount,
      beneficiary_id: donation.beneficiary_id
    });

  } catch (error) {
    console.error("Manual transfer error:", error);
    return res.status(500).json({ 
      error: error.message || "Transfer failed" 
    });
  }
};

// Get settlement status for all donations
export const getSettlementStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all campaigns for this NGO
    const campaigns = await Campaign.find({ created_by: userId });
    const campaignIds = campaigns.map(c => c._id);

    // Get settlement summary
    const settlementStats = await Donation.aggregate([
      {
        $match: {
          campaign_id: { $in: campaignIds },
          payment_status: "PAID"
        }
      },
      {
        $group: {
          _id: "$settlement_status",
          count: { $sum: 1 },
          total_amount: { $sum: "$amount" },
          net_amount: { $sum: "$net_amount" }
        }
      }
    ]);

    // Get pending settlements
    const pendingSettlements = await Donation.find({
      campaign_id: { $in: campaignIds },
      payment_status: "PAID",
      settlement_status: "PENDING"
    })
    .populate('campaign_id', 'title')
    .sort({ paid_at: -1 })
    .limit(10);

    return res.json({
      success: true,
      settlement_summary: settlementStats,
      pending_settlements: pendingSettlements.map(donation => ({
        order_id: donation.cashfree_order_id,
        campaign_title: donation.campaign_id.title,
        amount: donation.amount,
        net_amount: donation.net_amount,
        paid_at: donation.paid_at,
        days_pending: Math.floor((new Date() - donation.paid_at) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error("Get settlement status error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch settlement status" 
    });
  }
};

// Helper function to get status message
function getStatusMessage(status) {
  switch (status) {
    case "PAID":
      return "Payment successful! Thank you for your donation.";
    case "FAILED":
      return "Payment failed. Please try again.";
    case "CANCELLED":
      return "Payment was cancelled.";
    case "PENDING":
      return "Payment is being processed...";
    default:
      return "Payment status unknown.";
  }
}

// Verify webhook signature (implement based on Cashfree docs)
function verifyWebhookSignature(payload, signature) {
  // Implement webhook signature verification
  // This is a placeholder - implement according to Cashfree documentation
  return true;
}

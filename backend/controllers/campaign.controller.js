import Campaign from "../models/campaign.model.js";
import User from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/campaigns";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 21 // 1 logo + 20 activity photos max
  }
});

// Create new campaign
export const createCampaign = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user is NGO and has verified beneficiary details
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== 'ngo') {
      return res.status(403).json({ error: "Only NGOs can create campaigns" });
    }

    if (!user.verified || !user.ngoDetails || !user.ngoDetails.beneficiary_id) {
      return res.status(400).json({ 
        error: "NGO must be verified and have beneficiary details to create campaigns. Please complete NGO registration first." 
      });
    }

    console.log("Creating campaign for NGO:", user.fullName);
    console.log("Beneficiary ID:", user.ngoDetails.beneficiary_id);
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    const {
      title, description, goal_amount, category, start_date, end_date,
      location, contact_person, contact_email, contact_phone,
      beneficiary_details, tags
    } = req.body;

    // Validate required fields
    const requiredFields = {
      title, description, goal_amount, category, start_date, end_date,
      contact_person, contact_email, contact_phone
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Validate goal amount
    if (isNaN(goal_amount) || goal_amount <= 0) {
      return res.status(400).json({ error: "Goal amount must be a positive number" });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    // Process uploaded files
    let logoPath = "";
    let activityPhotos = [];

    if (req.files) {
      // Handle logo
      if (req.files.logo && req.files.logo[0]) {
        logoPath = req.files.logo[0].path;
      }

      // Handle activity photos
      if (req.files.activity_photos) {
        activityPhotos = req.files.activity_photos.map(file => file.path);
      }
    }

    // Create campaign object
    const campaignData = {
      title: title.trim(),
      description: description.trim(),
      goal_amount: parseFloat(goal_amount),
      current_amount: 0,
      category,
      start_date: startDate,
      end_date: endDate,
      location: location?.trim() || "",
      contact_person: contact_person.trim(),
      contact_email: contact_email.trim().toLowerCase(),
      contact_phone: contact_phone.trim(),
      beneficiary_details: beneficiary_details?.trim() || "",
      tags: tags || "",
      logo: logoPath,
      activity_photos: activityPhotos,
      created_by: req.user._id,
      beneficiary_id: user.ngoDetails.beneficiary_id, // Add beneficiary ID from NGO details
      campaign_status: "active"
    };

    // Create and save campaign
    const campaign = new Campaign(campaignData);
    const savedCampaign = await campaign.save();

    console.log("Campaign created successfully:", savedCampaign._id);

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign_id: savedCampaign._id,
      beneficiary_id: savedCampaign.beneficiary_id, // Include beneficiary ID in response
      campaign: {
        id: savedCampaign._id,
        title: savedCampaign.title,
        goal_amount: savedCampaign.goal_amount,
        category: savedCampaign.category,
        status: savedCampaign.campaign_status,
        progress_percentage: savedCampaign.progress_percentage,
        beneficiary_id: savedCampaign.beneficiary_id
      }
    });

  } catch (err) {
    console.error("Create Campaign Error:", err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "Campaign with this title already exists" 
      });
    }

    return res.status(500).json({ 
      error: "Failed to create campaign. Please try again." 
    });
  }
};

// Get all campaigns (with filters)
export const getCampaigns = async (req, res) => {
  try {
    const { 
      category, 
      status = "active", 
      page = 1, 
      limit = 10,
      search,
      created_by 
    } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.campaign_status = status;
    if (created_by) filter.created_by = created_by;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find(filter)
      .populate('created_by', 'fullName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(filter);

    return res.json({
      campaigns,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_campaigns: total,
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    console.error("Get Campaigns Error:", err);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};

// Get single campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id)
      .populate('created_by', 'fullName email profilePicture')
      .populate('donors.user_id', 'fullName profilePicture');

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    return res.json(campaign);

  } catch (err) {
    console.error("Get Campaign Error:", err);
    return res.status(500).json({ error: "Failed to fetch campaign" });
  }
};

// Update campaign (only by creator)
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only update your own campaigns" });
    }

    // Update campaign
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    return res.json({
      message: "Campaign updated successfully",
      campaign: updatedCampaign
    });

  } catch (err) {
    console.error("Update Campaign Error:", err);
    return res.status(500).json({ error: "Failed to update campaign" });
  }
};

// Delete campaign (only by creator)
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own campaigns" });
    }

    // Delete associated files
    if (campaign.logo && fs.existsSync(campaign.logo)) {
      fs.unlinkSync(campaign.logo);
    }
    campaign.activity_photos.forEach(photo => {
      if (fs.existsSync(photo)) {
        fs.unlinkSync(photo);
      }
    });

    // Delete campaign
    await Campaign.findByIdAndDelete(id);

    return res.json({ message: "Campaign deleted successfully" });

  } catch (err) {
    console.error("Delete Campaign Error:", err);
    return res.status(500).json({ error: "Failed to delete campaign" });
  }
};

// Donate to campaign
export const donateToCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_id, anonymous = false } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Valid donation amount is required" });
    }

    // Find campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Check if campaign is active and within date range
    if (!campaign.is_active) {
      return res.status(400).json({ error: "Campaign is not active or has ended" });
    }

    // Add donation to campaign
    const donation = {
      user_id: req.user?._id || null,
      amount: parseFloat(amount),
      payment_id: payment_id,
      anonymous: anonymous,
      donated_at: new Date()
    };

    campaign.donors.push(donation);
    campaign.current_amount += parseFloat(amount);
    campaign.total_donors = campaign.donors.length;

    // Save campaign
    await campaign.save();

    return res.json({
      message: "Donation recorded successfully",
      campaign: {
        id: campaign._id,
        title: campaign.title,
        current_amount: campaign.current_amount,
        goal_amount: campaign.goal_amount,
        progress_percentage: campaign.progress_percentage,
        total_donors: campaign.total_donors
      },
      beneficiary_id: campaign.beneficiary_id // Return beneficiary ID for payment processing
    });

  } catch (err) {
    console.error("Donate to Campaign Error:", err);
    return res.status(500).json({ error: "Failed to process donation" });
  }
};

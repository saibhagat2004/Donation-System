import Campaign from "../models/campaign.model.js";
import User from "../models/user.model.js";
import { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

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
    console.log("Files received:", req.files);
    
    // Debug file information
    if (req.files) {
      if (req.files.logo) {
        console.log("Logo file details:", {
          fieldname: req.files.logo[0]?.fieldname,
          originalname: req.files.logo[0]?.originalname,
          mimetype: req.files.logo[0]?.mimetype,
          size: req.files.logo[0]?.size,
          hasBuffer: !!req.files.logo[0]?.buffer
        });
      }
      if (req.files.activity_photos) {
        console.log("Activity photos count:", req.files.activity_photos.length);
        req.files.activity_photos.forEach((file, index) => {
          console.log(`Photo ${index + 1}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hasBuffer: !!file.buffer
          });
        });
      }
    } else {
      console.log("No files received in request");
    }

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

    // Process uploaded files with Cloudinary
    let logoUrl = "";
    let logoPublicId = "";
    let activityPhotos = [];
    let activityPhotoPublicIds = [];

    console.log("Starting file upload process...");

    try {
      if (req.files && Object.keys(req.files).length > 0) {
        console.log("Files found, processing uploads...");
        
        // Handle logo upload to Cloudinary
        if (req.files.logo && req.files.logo[0]) {
          console.log("Uploading logo to Cloudinary...");
          console.log("Logo buffer size:", req.files.logo[0].buffer?.length || 0, "bytes");
          
          const logoResult = await uploadToCloudinary(
            req.files.logo[0].buffer, 
            'donation-system/campaigns/logos'
          );
          logoUrl = logoResult.url;
          logoPublicId = logoResult.public_id;
          console.log("Logo uploaded successfully:", logoUrl);
        } else {
          console.log("No logo file found or file is empty");
        }

        // Handle activity photos upload to Cloudinary
        if (req.files.activity_photos && req.files.activity_photos.length > 0) {
          console.log(`Uploading ${req.files.activity_photos.length} activity photos to Cloudinary...`);
          
          // Check if all files have buffers
          const validFiles = req.files.activity_photos.filter(file => file.buffer && file.buffer.length > 0);
          console.log(`Valid files with buffers: ${validFiles.length}/${req.files.activity_photos.length}`);
          
          if (validFiles.length > 0) {
            const photoBuffers = validFiles.map(file => file.buffer);
            const photoResults = await uploadMultipleToCloudinary(
              photoBuffers, 
              'donation-system/campaigns/activity-photos'
            );
            
            activityPhotos = photoResults.map(result => result.url);
            activityPhotoPublicIds = photoResults.map(result => result.public_id);
            console.log("Activity photos uploaded successfully:", activityPhotos.length, "photos");
            console.log("Photo URLs:", activityPhotos);
          } else {
            console.log("No valid activity photos with buffers found");
          }
        } else {
          console.log("No activity photos found");
        }
      } else {
        console.log("No files in request");
      }
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      console.error("Upload error stack:", uploadError.stack);
      return res.status(500).json({ 
        error: "Failed to upload images. Please try again.",
        details: uploadError.message 
      });
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
      logo: logoUrl,
      logo_public_id: logoPublicId,
      activity_photos: activityPhotos,
      activity_photos_public_ids: activityPhotoPublicIds,
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
      .populate('created_by', 'fullName email profilePicture ngoDetails')
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
      .populate('created_by', 'fullName email profilePicture ngoDetails')
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

    // Delete associated images from Cloudinary
    try {
      if (campaign.logo_public_id) {
        await deleteFromCloudinary(campaign.logo_public_id);
        console.log("Logo deleted from Cloudinary:", campaign.logo_public_id);
      }
      
      if (campaign.activity_photos_public_ids && campaign.activity_photos_public_ids.length > 0) {
        const deletePromises = campaign.activity_photos_public_ids.map(publicId => 
          deleteFromCloudinary(publicId)
        );
        await Promise.all(deletePromises);
        console.log("Activity photos deleted from Cloudinary:", campaign.activity_photos_public_ids.length, "photos");
      }
    } catch (deleteError) {
      console.error("Error deleting images from Cloudinary:", deleteError);
      // Continue with campaign deletion even if image deletion fails
    }

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

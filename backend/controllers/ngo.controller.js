import User from "../models/user.model.js";

// Check NGO verification status
export const checkNGOVerificationStatus = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user details
    const user = await User.findById(req.user._id).select('role verified ngoDetails fullName email');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is NGO
    if (user.role !== 'ngo') {
      return res.status(403).json({ 
        error: "This endpoint is only for NGOs",
        user_role: user.role 
      });
    }

    // Check verification status and required details
    const isVerified = user.verified;
    const hasNGODetails = user.ngoDetails && 
                         user.ngoDetails.org_name && 
                         user.ngoDetails.beneficiary_id && 
                         user.ngoDetails.bank_account &&
                         user.ngoDetails.ifsc;

    const verificationStatus = {
      is_verified: isVerified,
      has_ngo_details: hasNGODetails,
      can_create_campaigns: isVerified && hasNGODetails,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }
    };

    // Add details about what's missing if not fully verified
    if (!isVerified || !hasNGODetails) {
      verificationStatus.missing_requirements = [];
      
      if (!isVerified) {
        verificationStatus.missing_requirements.push("NGO verification pending");
      }
      
      if (!hasNGODetails) {
        verificationStatus.missing_requirements.push("NGO details incomplete");
        
        // Specify which NGO details are missing
        const missingDetails = [];
        if (!user.ngoDetails?.org_name) missingDetails.push("Organization name");
        if (!user.ngoDetails?.beneficiary_id) missingDetails.push("Beneficiary ID");
        if (!user.ngoDetails?.bank_account) missingDetails.push("Bank account");
        if (!user.ngoDetails?.ifsc) missingDetails.push("IFSC code");
        
        verificationStatus.missing_ngo_details = missingDetails;
      }
    }

    return res.json({
      message: "NGO verification status retrieved successfully",
      verification: verificationStatus
    });

  } catch (err) {
    console.error("Check NGO Verification Error:", err);
    return res.status(500).json({ 
      error: "Failed to check verification status" 
    });
  }
};

// Get NGO profile details
export const getNGOProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== 'ngo') {
      return res.status(403).json({ error: "This endpoint is only for NGOs" });
    }

    return res.json({
      message: "NGO profile retrieved successfully",
      ngo: user
    });

  } catch (err) {
    console.error("Get NGO Profile Error:", err);
    return res.status(500).json({ 
      error: "Failed to fetch NGO profile" 
    });
  }
};

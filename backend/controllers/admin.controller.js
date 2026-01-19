import User from "../models/user.model.js";

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

// Get all pending NGO verification requests
export const getPendingNGOs = async (req, res) => {
  try {
    const pendingNGOs = await User.find({ 
      role: 'ngo', 
      verified: false,
      'ngoDetails.beneficiary_id': { $exists: true } // Only show NGOs that have submitted details
    })
    .select('-password')
    .sort({ createdAt: -1 }); // Newest first

    console.log(`✅ Found ${pendingNGOs.length} pending NGO(s) for verification`);

    return res.json({
      message: "Pending NGO verification requests retrieved successfully",
      count: pendingNGOs.length,
      ngos: pendingNGOs
    });

  } catch (err) {
    console.error("Get Pending NGOs Error:", err);
    return res.status(500).json({ error: "Failed to fetch pending NGOs" });
  }
};

// Get all verified NGOs
export const getVerifiedNGOs = async (req, res) => {
  try {
    const verifiedNGOs = await User.find({ 
      role: 'ngo', 
      verified: true 
    })
    .select('-password')
    .sort({ createdAt: -1 });

    return res.json({
      message: "Verified NGOs retrieved successfully",
      count: verifiedNGOs.length,
      ngos: verifiedNGOs
    });

  } catch (err) {
    console.error("Get Verified NGOs Error:", err);
    return res.status(500).json({ error: "Failed to fetch verified NGOs" });
  }
};

// Get all NGOs (verified and pending)
export const getAllNGOs = async (req, res) => {
  try {
    const allNGOs = await User.find({ role: 'ngo' })
    .select('-password')
    .sort({ createdAt: -1 });

    const stats = {
      total: allNGOs.length,
      verified: allNGOs.filter(ngo => ngo.verified).length,
      pending: allNGOs.filter(ngo => !ngo.verified && ngo.ngoDetails?.beneficiary_id).length,
      incomplete: allNGOs.filter(ngo => !ngo.ngoDetails?.beneficiary_id).length
    };

    return res.json({
      message: "All NGOs retrieved successfully",
      stats,
      ngos: allNGOs
    });

  } catch (err) {
    console.error("Get All NGOs Error:", err);
    return res.status(500).json({ error: "Failed to fetch NGOs" });
  }
};

// Verify/Approve an NGO
export const verifyNGO = async (req, res) => {
  try {
    const { ngoId } = req.params;

    const ngo = await User.findById(ngoId);
    
    if (!ngo) {
      return res.status(404).json({ error: "NGO not found" });
    }

    if (ngo.role !== 'ngo') {
      return res.status(400).json({ error: "User is not an NGO" });
    }

    if (ngo.verified) {
      return res.status(400).json({ error: "NGO is already verified" });
    }

    // Check if NGO has submitted required details
    if (!ngo.ngoDetails || !ngo.ngoDetails.beneficiary_id) {
      return res.status(400).json({ 
        error: "NGO has not submitted beneficiary details yet" 
      });
    }

    ngo.verified = true;
    await ngo.save();

    return res.json({
      message: "NGO verified successfully",
      ngo: {
        id: ngo._id,
        name: ngo.fullName,
        email: ngo.email,
        org_name: ngo.ngoDetails?.org_name,
        verified: ngo.verified,
        verifiedAt: new Date()
      }
    });

  } catch (err) {
    console.error("Verify NGO Error:", err);
    return res.status(500).json({ error: "Failed to verify NGO" });
  }
};

// Reject an NGO verification request
export const rejectNGO = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { reason } = req.body;

    const ngo = await User.findById(ngoId);
    
    if (!ngo) {
      return res.status(404).json({ error: "NGO not found" });
    }

    if (ngo.role !== 'ngo') {
      return res.status(400).json({ error: "User is not an NGO" });
    }

    // You could add a rejectionReason field to the model if needed
    // For now, we'll just keep them unverified
    ngo.verified = false;

    await ngo.save();

    return res.json({
      message: "NGO verification rejected",
      ngo: {
        id: ngo._id,
        name: ngo.fullName,
        email: ngo.email,
        verified: ngo.verified
      },
      reason: reason || "No reason provided"
    });

  } catch (err) {
    console.error("Reject NGO Error:", err);
    return res.status(500).json({ error: "Failed to reject NGO" });
  }
};

// Get NGO details by ID (for admin review)
export const getNGOById = async (req, res) => {
  try {
    const { ngoId } = req.params;

    const ngo = await User.findById(ngoId).select('-password');
    
    if (!ngo) {
      return res.status(404).json({ error: "NGO not found" });
    }

    if (ngo.role !== 'ngo') {
      return res.status(400).json({ error: "User is not an NGO" });
    }

    return res.json({
      message: "NGO details retrieved successfully",
      ngo: ngo
    });

  } catch (err) {
    console.error("Get NGO By ID Error:", err);
    return res.status(500).json({ error: "Failed to fetch NGO details" });
  }
};

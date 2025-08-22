import express from "express";
import { 
  createCampaign, 
  getCampaigns, 
  getCampaignById, 
  updateCampaign, 
  deleteCampaign,
  donateToCampaign
} from "../controllers/campaign.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { uploadMemory, handleMulterError } from "../middleware/uploadMiddleware.js";
import { debugRequest } from "../middleware/debugMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCampaigns); // Get all campaigns with filters
router.get("/:id", getCampaignById); // Get single campaign

// Protected routes (require authentication)
router.post("/create", 
  protectRoute, 
  uploadMemory.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'activity_photos', maxCount: 20 }
  ]), 
  debugRequest, // Add debug middleware temporarily
  createCampaign
); // Create new campaign

// Add error handling middleware after the route
router.use(handleMulterError);

router.put("/:id", protectRoute, updateCampaign); // Update campaign
router.delete("/:id", protectRoute, deleteCampaign); // Delete campaign
router.post("/:id/donate", donateToCampaign); // Donate to campaign (public or authenticated)

export default router;

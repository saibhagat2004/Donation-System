import express from "express";
import { 
  getPendingNGOs, 
  getVerifiedNGOs, 
  getAllNGOs, 
  verifyNGO, 
  rejectNGO,
  getNGOById,
  isAdmin 
} from "../controllers/admin.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protectRoute, isAdmin);

// Get all NGOs (with stats)
router.get("/ngos", getAllNGOs);

// Get pending NGO verification requests
router.get("/ngos/pending", getPendingNGOs);

// Get verified NGOs
router.get("/ngos/verified", getVerifiedNGOs);

// Get specific NGO details
router.get("/ngos/:ngoId", getNGOById);

// Approve/Verify NGO
router.put("/ngos/verify/:ngoId", verifyNGO);

// Reject NGO verification
router.post("/ngos/reject/:ngoId", rejectNGO);

export default router;

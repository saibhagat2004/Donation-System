import express from "express";
import { checkNGOVerificationStatus, getNGOProfile } from "../controllers/ngo.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/verification-status", protectRoute, checkNGOVerificationStatus);
router.get("/profile", protectRoute, getNGOProfile);

export default router;

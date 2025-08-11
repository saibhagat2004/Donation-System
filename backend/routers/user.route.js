import express from "express"
import { protectRoute } from "../middleware/protectRoute.js";
import {updateUser,updateUserRole } from "../controllers/users.controller.js";


const router = express.Router();


router.post("/update",protectRoute,updateUser);
router.post("/update-role",protectRoute,updateUserRole)

export default router;
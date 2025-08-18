import express from "express"
import { protectRoute } from "../middleware/protectRoute.js";
import {createOrder,verifyOrder,addBeneficiary} from "../controllers/cashfreepg.controller.js";


const router = express.Router();


router.post("/createOrder",createOrder);
router.post("/verify-order", verifyOrder);
router.post("/addBeneficiary",protectRoute,addBeneficiary)


export default router;
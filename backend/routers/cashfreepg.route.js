import express from "express"
import {createOrder,verifyOrder} from "../controllers/cashfreepg.controller.js";


const router = express.Router();


router.post("/createOrder",createOrder);
router.post("/verify-order", verifyOrder);


export default router;
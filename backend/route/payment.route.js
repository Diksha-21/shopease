import express from "express";
import { createPayment, verifyPayment } from "../controller/payment.controller.js";
import { authenticateToken } from "../auth/token.js";

const router = express.Router();

router.post("/create", authenticateToken, createPayment);
router.post("/verify", authenticateToken, verifyPayment); 

const paymentRoutes = router;
export default paymentRoutes;
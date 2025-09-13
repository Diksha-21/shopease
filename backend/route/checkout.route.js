import express from "express";
import { authenticateToken } from "../auth/token.js";
import { buildOrderItems } from "../controller/checkout.controller.js";

const router = express.Router();
router.use(authenticateToken);
router.post("/build", buildOrderItems);

const checkoutRoutes = router;
export default checkoutRoutes;

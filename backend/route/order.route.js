import express from "express";
import { 
  placeOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  getSellerOrders
} from "../controller/order.controller.js";
import { authenticateToken } from "../auth/token.js";
import verifyRole from "../auth/roleMiddleware.js";

const router = express.Router();

// Buyer routes
router.post("/place", authenticateToken, verifyRole('buyer'), placeOrder);
router.get("/buyer", authenticateToken, verifyRole('buyer'), getOrders);
// Seller routes
router.get("/seller", authenticateToken, verifyRole('seller'), getSellerOrders);

router.get("/:orderId", authenticateToken, verifyRole('buyer'), getOrderDetails);
router.delete("/:orderId/cancel", authenticateToken, verifyRole('buyer'), cancelOrder);



const orderRoute = router;
export default orderRoute;
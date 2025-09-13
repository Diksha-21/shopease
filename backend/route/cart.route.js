import express from "express";
import { addToCart, removeFromCart, getCart, clearCart, updateCartItem } from "../controller/cart.controller.js";
import { authenticateToken } from '../auth/token.js';
import verifyRole from "../auth/roleMiddleware.js";

const router = express.Router();

router.get('/', authenticateToken, verifyRole('buyer'), getCart);
router.post('/items', authenticateToken, verifyRole('buyer'), addToCart);
router.put('/items/:productId', authenticateToken, verifyRole('buyer'), updateCartItem);
router.delete('/items/:productId', authenticateToken, verifyRole('buyer'), removeFromCart);
router.delete('/', authenticateToken, verifyRole('buyer'), clearCart);

const cartRoutes = router;
export default cartRoutes;
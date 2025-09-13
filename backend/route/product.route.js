import express from 'express';
import { createProduct, deleteProduct, getBuyerProducts, getPublicProducts, getSellerProducts, searchProducts, updateProduct } from '../controller/product.controller.js';
import { authenticateToken } from '../auth/token.js';
import verifyRole from '../auth/roleMiddleware.js';
import { handleProductImages } from '../upload/upload.js';

const router = express.Router();


router.get('/public', getPublicProducts);
router.post('/search', searchProducts);
router.get('/buyer', authenticateToken, verifyRole('buyer'), getBuyerProducts);
router.get('/seller', authenticateToken, verifyRole('seller'), getSellerProducts);
router.post('/create', authenticateToken, verifyRole('seller'), handleProductImages, createProduct);
router.put('/seller/:productId', authenticateToken, verifyRole('seller'), handleProductImages, updateProduct);
router.delete('/seller/:productId', authenticateToken, verifyRole('seller'), deleteProduct);


const productRoutes = router;
export default productRoutes;
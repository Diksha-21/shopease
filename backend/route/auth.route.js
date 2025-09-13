import express from 'express';
import { register, login, requestPasswordReset, resetPassword } from '../controller/auth.controller.js'; 
import { createUploader } from '../upload/upload.js';

const router = express.Router();

router.post('/register', createUploader('profile', 'single', 'profileImage'), register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.put('/reset-password', resetPassword);

const authRoutes = router;
export default authRoutes;
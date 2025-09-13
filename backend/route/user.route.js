import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  switchRole, 
  deleteUser,
  changePassword,
  updateSettings
} from '../controller/user.controller.js';
import { authenticateToken } from '../auth/token.js';
import createUploader from '../upload/upload.js';

const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/settings', authenticateToken, createUploader('profile', 'single', 'profileImage'), updateSettings);
router.put('/change-password', authenticateToken, changePassword);
router.post('/switch-role', authenticateToken, switchRole);
router.delete('/', authenticateToken, deleteUser);

const userRoutes = router;
export default userRoutes;
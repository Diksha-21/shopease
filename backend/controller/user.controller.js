import User from '../model/user.model.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { generateAuthToken, getUserData } from '../auth/token.js';
import { parseJsonField, validateAddressFields, attachProfileImage } from '../utils/userValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUserOr404 = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return null;
  }
  return user;
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.profileImage && !user.profileImage.startsWith('http')) {
      const base = process.env.STORAGE_URL || `http://${req.get('host')}`;
      user.profileImage = `${base}/uploads/profile-images/${user.profileImage}`;
    }
    res.status(200).json({ success: true, user: getUserData(user) });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await getUserOr404(req, res);
    if (!user) return;

    const { phone, companyName, address, settings } = req.body;

    if (phone) user.phone = phone;

    if (address) {
      const parsedAddress = parseJsonField(address, 'address');
      validateAddressFields(parsedAddress);
      user.address = parsedAddress;
    }

    if (settings) {
      const parsedSettings = parseJsonField(settings, 'settings');
      user.settings = {
        notifications: parsedSettings.notifications ?? user.settings?.notifications,
        emailUpdates: parsedSettings.emailUpdates ?? user.settings?.emailUpdates
      };
    }

    if (companyName && !user.roles.includes('seller')) {
      user.companyName = companyName;
      user.roles.push('seller');
      user.activeRole = 'seller';
    }

    // ✅ Store only filename
    attachProfileImage(user, req.file);

    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', user: getUserData(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const user = await getUserOr404(req, res);
    if (!user) return;

    const { phone, companyName, address, settings } = req.body;

    if (phone) user.phone = phone;

    if (address) {
      const parsedAddress = parseJsonField(address, 'address');
      validateAddressFields(parsedAddress);
      user.address = parsedAddress;
    }

    if (settings) {
      const parsedSettings = parseJsonField(settings, 'settings');
      user.settings = {
        notifications: parsedSettings.notifications ?? user.settings?.notifications,
        emailUpdates: parsedSettings.emailUpdates ?? user.settings?.emailUpdates
      };
    }

    if (companyName && !user.roles.includes('seller')) {
      user.companyName = companyName;
      user.roles.push('seller');
    }

    attachProfileImage(user, req.file);

    await user.save();
    res.status(200).json({ success: true, message: 'Settings updated successfully', user: getUserData(user) });
  } catch (error) {
    console.error('Settings update error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

export const switchRole = async (req, res) => {
  try {
    const user = await getUserOr404(req, res);
    if (!user) return;

    const targetRole = req.body?.role;
    if (!targetRole || !['buyer', 'seller'].includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role to switch' });
    }

    if (!user.roles.includes('buyer')) {
      user.roles.push('buyer');
    }

    if (targetRole === 'seller') {
      if (!user.roles.includes('seller')) {
        const companyName = req.body?.companyName?.trim();
        if (!companyName) {
          return res.status(400).json({ success: false, message: 'Company name required to become a seller' });
        }
        user.roles.push('seller');
        user.companyName = companyName;
      }
      user.activeRole = 'seller';
    } else {
      user.activeRole = 'buyer';
    }

    await user.save();
    const token = generateAuthToken({
      ...user.toObject(),
      activeRole: user.activeRole,
      roles: user.roles
    });

    return res.status(200).json({
      success: true,
      message: `Switched to ${user.activeRole}`,
      token,
      user: getUserData(user),
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Account deletion failed' });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = await getUserOr404(req, res);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return;
    }

    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'profile-images', path.basename(user.profileImage));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profileImage = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: `${req.protocol}://${req.get('host')}/uploads/profile-images/${user.profileImage}`,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
};

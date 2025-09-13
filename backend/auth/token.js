import jwt from 'jsonwebtoken';

export const generateAuthToken = (user, rememberMe = false) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    roles: user.roles || ['buyer'],
    activeRole: user.activeRole || 'buyer',
    role: user.activeRole || 'buyer',
    action: 'auth'
  };

  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing or invalid token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 normalize to always have both id & _id
    req.user = {
      _id: decoded.id,   // for mongoose controllers
      id: decoded.id,    // for frontend payloads
      role: decoded.role || decoded.activeRole || 'buyer',
      activeRole: decoded.activeRole || decoded.role || 'buyer',
      roles: decoded.roles || [],
    };

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const generateResetToken = (userId) => {
  return jwt.sign(
    { id: userId, action: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token decode failed:", err.message);
    return null;
  }
};

export const getUserData = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.activeRole,
  roles: user.roles,
  activeRole: user.activeRole,
  companyName: user.companyName,
  profileImage: user.profileImage,
  settings: user.settings
});

const verifyRole = (required) => (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
 
    if (req.path.startsWith('/dashboard')) {
      if (req.user.activeRole !== required) {
        return res.status(403).json({ message: 'Forbidden: incorrect active role' });
      }
      return next();
    }

    if (!req.user.roles?.includes(required)) {
      return res.status(403).json({ message: 'Forbidden: role not assigned' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Role verification failed' });
  }
};

export default verifyRole;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role email');
    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role: user?.role || 'member',
      email: user?.email,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const user = await User.findById(req.user?.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default { generateToken, protect, requireAdmin };

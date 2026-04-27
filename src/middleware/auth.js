/**
 * Authentication Middleware
 * JWT token validation and role-based authorization
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authenticate JWT token from Authorization header or cookies
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;

    if (!token) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        requestId: req.id,
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        requestId: req.id,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        requestId: req.id,
      });
    }

    res.status(401).json({
      error: 'Authentication failed',
      requestId: req.id,
    });
  }
};

/**
 * Authorize based on user role
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        requestId: req.id,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requestId: req.id,
      });
    }

    next();
  };
};

/**
 * Authorize based on user permission
 */
const authorizePermission = (...allowedPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        requestId: req.id,
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = allowedPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requestId: req.id,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission,
};

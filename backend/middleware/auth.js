const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Provides JWT-based authentication and role-based authorization
 */

/**
 * Protect routes - Require valid JWT token
 * Verifies token and attaches user to request object
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check for token in cookies as fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // No token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
      code: 'NO_TOKEN',
    });
  }

  try {
    // Verify JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        code: 'CONFIG_ERROR',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token payload
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN',
      });
    }

    // Get user from database (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Account may have been deleted.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN',
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not yet valid',
        code: 'TOKEN_NOT_ACTIVE',
      });
    }

    // Generic authentication error
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to users with specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(' or ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        currentRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token
 * Useful for routes that work both authenticated and unauthenticated
 */
const optionalAuth = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check cookies as fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // No token - continue without user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id) {
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      // Only attach user if found and active
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token invalid but continue without user
    // This is optional auth, so we don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth: Invalid token, continuing without user');
    }
  }

  next();
};

/**
 * Require verified email middleware
 * Use after protect middleware to require email verification
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED',
    });
  }

  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

/**
 * Check ownership middleware factory
 * Creates middleware that checks if user owns the resource
 * @param {Function} getOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 */
const checkOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
      });
    }

    try {
      const ownerId = await getOwnerId(req);

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          code: 'NOT_OWNER',
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireVerified,
  checkOwnership,
};

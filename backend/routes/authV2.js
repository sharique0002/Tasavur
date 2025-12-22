const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { sanitizeEmail } = require('../utils/sanitizer');

// Rate limiters for auth endpoints (disabled in test environment)
const isTestEnv = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip in test environment
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created, please try again later',
  skip: () => isTestEnv, // Skip in test environment
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset requests, please try again later',
  skip: () => isTestEnv, // Skip in test environment
});

/**
 * Send token response with HTTP-only cookie for refresh token
 */
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  // Generate access token (short TTL)
  const accessToken = user.getSignedJwtToken();

  // Generate refresh token (long TTL)
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to database
  await user.addRefreshToken(refreshToken);

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Set refresh token as HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      avatar: user.avatar,
    },
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
      .optional()
      .isIn(['founder', 'mentor', 'investor', 'admin'])
      .withMessage('Invalid role'),
  ],
  asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    const { name, email, password, role, phone, bio } = req.body;

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      throw new ApiError(400, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email: sanitizedEmail,
      password,
      role: role || 'founder',
      phone,
      bio,
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send token response
    await sendTokenResponse(user, 201, res, 'User registered successfully');
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check for user (include password field)
    const user = await User.findOne({ email: sanitizedEmail }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Send token response
    await sendTokenResponse(user, 200, res, 'Login successful');
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token not provided');
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'Invalid token type');
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Check if refresh token is in database
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new access token
    const accessToken = user.getSignedJwtToken();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: accessToken,
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database
      await req.user.removeRefreshToken(refreshToken);
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate('startup', 'name domain stage')
      .populate('mentorProfile', 'expertise domains');

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/me',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('phone').optional().trim(),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    const allowedUpdates = ['name', 'phone', 'bio', 'avatar', 'profile'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  })
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;

    // Clear all refresh tokens on password change
    user.refreshTokens = [];

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  })
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    const { email } = req.body;
    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link will be sent',
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Create reset URL for email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // In production, implement email sending

    res.json({
      success: true,
      message: 'Password reset link sent to email',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  })
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Validation failed', errors.array());
    }

    // Hash token from URL
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpire: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpire');

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.refreshTokens = []; // Clear all refresh tokens

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  })
);

/**
 * @route   POST /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.post(
  '/verify-email/:token',
  asyncHandler(async (req, res) => {
    // Hash token from URL
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    }).select('+verificationToken +verificationTokenExpire');

    if (!user) {
      throw new ApiError(400, 'Invalid or expired verification token');
    }

    // Mark email as verified
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  })
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post(
  '/resend-verification',
  protect,
  asyncHandler(async (req, res) => {
    if (req.user.verified) {
      throw new ApiError(400, 'Email is already verified');
    }

    // Generate new verification token
    const verificationToken = req.user.generateVerificationToken();
    await req.user.save();

    // In production, implement verification email sending

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  })
);

module.exports = router;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * User Model
 * Handles authentication, user profiles, and role management
 * Supports roles: founder, mentor, investor, admin
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ['founder', 'mentor', 'investor', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'founder',
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      select: false,
    },

    verificationTokenExpire: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpire: {
      type: Date,
      select: false,
    },

    refreshTokens: {
      type: [{
        // Unique identifier for the refresh token (JWT ID)
        jti: {
          type: String,
        },
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        userAgent: String,
        ip: String,
      }],
      default: [],
    },

    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number'],
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },

    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // For founders - reference to their startup
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
    },

    // For mentors - reference to their mentor profile
    mentorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Unique index on email (case-insensitive)
userSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 }, name: 'email_unique_idx' }
);

// Compound index for role-based queries
userSchema.index(
  { role: 1, isActive: 1 },
  { name: 'role_active_idx' }
);

// Index for verified users
userSchema.index(
  { verified: 1, role: 1 },
  { name: 'verified_role_idx' }
);

// Index for last login tracking
userSchema.index(
  { lastLogin: -1 },
  { name: 'last_login_idx' }
);

// =============================================================================
// VIRTUALS
// =============================================================================

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// =============================================================================
// HOOKS
// =============================================================================

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Clean up expired refresh tokens before saving
userSchema.pre('save', function (next) {
  if (this.isModified('refreshTokens') && this.refreshTokens.length > 0) {
    const now = new Date();
    this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > now);
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} Whether passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword) return false;

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error.message);
    return false;
  }
};

/**
 * Generate JWT access token
 * @returns {string} JWT token
 */
userSchema.methods.getSignedJwtToken = function () {
  const payload = {
    id: this._id,
    role: this.role,
    email: this.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

/**
 * Generate refresh token
 * @returns {string} Refresh token
 */
userSchema.methods.generateRefreshToken = function () {
  const payload = {
    id: this._id,
    type: 'refresh',
    // Add unique JWT ID to ensure tokens are distinct even within same second
    jti: crypto.randomBytes(8).toString('hex'),
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Add refresh token to user's token list
 * @param {string} token - Refresh token
 * @param {Object} metadata - Optional metadata (userAgent, ip)
 */
userSchema.methods.addRefreshToken = async function (token, metadata = {}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Attempt to extract JWT ID (jti) from the token for uniqueness
  let jti;
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded.jti === 'string') {
      jti = decoded.jti;
    }
  } catch (e) {
    // If decode fails, continue without jti
  }

  this.refreshTokens.push({
    jti,
    token,
    expiresAt,
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  });

  // Keep only last 5 refresh tokens per user
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  await this.save();
};

/**
 * Remove refresh token from user's token list
 * @param {string} token - Refresh token to remove
 */
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  await this.save();
};

/**
 * Remove all refresh tokens (logout from all devices)
 */
userSchema.methods.removeAllRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

/**
 * Generate email verification token
 * @returns {string} Raw verification token
 */
userSchema.methods.generateVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version
  this.verificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 24 hours
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

  return rawToken;
};

/**
 * Verify the verification token
 * @param {string} token - Raw token to verify
 * @returns {boolean} Whether token is valid
 */
userSchema.methods.verifyVerificationToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.verificationToken === hashedToken &&
    this.verificationTokenExpire > Date.now()
  );
};

/**
 * Generate password reset token
 * @returns {string} Raw reset token
 */
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 10 minutes
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return rawToken;
};

/**
 * Verify the password reset token
 * @param {string} token - Raw token to verify
 * @returns {boolean} Whether token is valid
 */
userSchema.methods.verifyResetToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetExpire > Date.now()
  );
};

/**
 * Handle failed login attempt
 * Implements account lockout after multiple failures
 */
userSchema.methods.handleFailedLogin = async function () {
  // Increment login attempts
  this.loginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
  }

  await this.save();
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = new Date();
    await this.save();
  }
};

/**
 * Clean JSON output - remove sensitive data
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  // Remove sensitive fields
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.verificationToken;
  delete obj.verificationTokenExpire;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpire;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;

  return obj;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find user by email (case-insensitive)
 * @param {string} email - Email to search
 * @returns {Promise<User>} User document
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find active users by role
 * @param {string} role - Role to filter by
 * @returns {Promise<User[]>} Array of users
 */
userSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);

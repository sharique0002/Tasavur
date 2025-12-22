const validator = require('validator');

/**
 * Input Sanitization Utilities
 * Prevents XSS, injection, and other security threats
 */

// =============================================================================
// STRING SANITIZATION
// =============================================================================

/**
 * Sanitize string input
 * Removes HTML tags and escapes dangerous characters
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  if (input.length === 0) return input;

  // Escape HTML entities
  let sanitized = validator.escape(input);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
};

/**
 * Sanitize string for use in HTML
 * More aggressive sanitization for display
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Escape remaining entities
  sanitized = validator.escape(sanitized);

  return sanitized.trim();
};

// =============================================================================
// EMAIL SANITIZATION
// =============================================================================

/**
 * Sanitize and validate email
 * @param {string} email - Email to sanitize
 * @param {boolean} throwOnInvalid - Whether to throw on invalid email
 * @returns {string|null} Normalized email or null if invalid
 */
const sanitizeEmail = (email, throwOnInvalid = false) => {
  if (!email || typeof email !== 'string') {
    if (throwOnInvalid) {
      throw new Error('Email is required');
    }
    return email;
  }

  // Trim and lowercase
  let normalized = email.trim().toLowerCase();

  // Normalize email (remove dots from gmail, etc.)
  const normalizeOptions = {
    gmail_remove_dots: false, // Keep dots for consistency
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
    all_lowercase: true,
  };

  normalized = validator.normalizeEmail(normalized, normalizeOptions);

  // Validate
  if (!validator.isEmail(normalized)) {
    if (throwOnInvalid) {
      throw new Error('Invalid email format');
    }
    return email; // Return original if validation fails
  }

  return normalized;
};

// =============================================================================
// URL SANITIZATION
// =============================================================================

/**
 * Sanitize and validate URL
 * @param {string} url - URL to sanitize
 * @param {boolean} throwOnInvalid - Whether to throw on invalid URL
 * @returns {string|null} Sanitized URL or null if invalid
 */
const sanitizeUrl = (url, throwOnInvalid = false) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  let sanitized = url.trim();

  // Add protocol if missing
  if (sanitized && !sanitized.match(/^https?:\/\//i)) {
    sanitized = 'https://' + sanitized;
  }

  // Validate URL
  const urlOptions = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
  };

  if (!validator.isURL(sanitized, urlOptions)) {
    if (throwOnInvalid) {
      throw new Error('Invalid URL format');
    }
    return url; // Return original if validation fails
  }

  return sanitized;
};

// =============================================================================
// MONGODB QUERY SANITIZATION
// =============================================================================

/**
 * Sanitize MongoDB query to prevent injection
 * Removes operators ($) from query keys
 * @param {Object} query - Query object to sanitize
 * @returns {Object} Sanitized query
 */
const sanitizeMongoQuery = (query) => {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  if (Array.isArray(query)) {
    return query.map(item => sanitizeMongoQuery(item));
  }

  const sanitized = {};

  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) continue;

    // Skip keys starting with $ (MongoDB operators)
    if (key.startsWith('$')) {
      console.warn(`⚠️ Blocked MongoDB operator in query: ${key}`);
      continue;
    }

    // Skip keys containing . (dot notation injection)
    if (key.includes('.') && !isValidDotNotation(key)) {
      console.warn(`⚠️ Blocked suspicious dot notation: ${key}`);
      continue;
    }

    const value = query[key];

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Check if dot notation is valid (not injection attempt)
 * @param {string} key - Key to check
 * @returns {boolean} Whether key is valid
 */
const isValidDotNotation = (key) => {
  // Allow common valid dot notation patterns
  const validPatterns = [
    /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/,
  ];

  return validPatterns.some(pattern => pattern.test(key));
};

// =============================================================================
// REQUEST BODY SANITIZATION
// =============================================================================

/**
 * Sanitize entire request body
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map(item => sanitizeBody(item));
  }

  const sanitized = {};

  for (const key in body) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;

    const value = body[key];

    // Skip Buffer and binary data
    if (Buffer.isBuffer(value)) {
      sanitized[key] = value;
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeBody(item);
        }
        return item;
      });
      continue;
    }

    // Handle nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
      continue;
    }

    // Handle strings with special field handling
    if (typeof value === 'string') {
      const lowerKey = key.toLowerCase();

      // Email fields
      if (lowerKey === 'email' || lowerKey.includes('email')) {
        sanitized[key] = sanitizeEmail(value, false);
      }
      // URL fields
      else if (lowerKey.includes('url') || lowerKey.includes('link') || lowerKey.includes('website')) {
        sanitized[key] = sanitizeUrl(value, false);
      }
      // Password fields - don't sanitize (may contain special chars)
      else if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
        sanitized[key] = value; // Keep as-is
      }
      // Regular strings
      else {
        sanitized[key] = sanitizeString(value);
      }
      continue;
    }

    // Pass through other types (numbers, booleans, etc.)
    sanitized[key] = value;
  }

  return sanitized;
};

// =============================================================================
// EXPRESS MIDDLEWARE
// =============================================================================

/**
 * Express middleware to sanitize request data
 */
const sanitizeMiddleware = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeMongoQuery(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }

  next();
};

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if string is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

/**
 * Validate and sanitize numeric input
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {number|null} Validated number or null
 */
const sanitizeNumber = (value, options = {}) => {
  const { min, max, defaultValue = null, integer = false } = options;

  let num = parseFloat(value);

  if (isNaN(num)) {
    return defaultValue;
  }

  if (integer) {
    num = Math.floor(num);
  }

  if (typeof min === 'number' && num < min) {
    return min;
  }

  if (typeof max === 'number' && num > max) {
    return max;
  }

  return num;
};

module.exports = {
  sanitizeString,
  sanitizeHtml,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeMongoQuery,
  sanitizeBody,
  sanitizeMiddleware,
  sanitizeNumber,
  isValidObjectId,
};

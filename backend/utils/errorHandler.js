/**
 * Centralized Error Handler Utility
 * Provides consistent error responses across all endpoints
 */

/**
 * Custom API Error class
 * Extends Error with HTTP status code and additional metadata
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true; // Distinguishes from programming errors
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message, errors = null) {
    return new ApiError(400, message, errors, 'BAD_REQUEST');
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, null, 'UNAUTHORIZED');
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Access denied') {
    return new ApiError(403, message, null, 'FORBIDDEN');
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, null, 'NOT_FOUND');
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message) {
    return new ApiError(409, message, null, 'CONFLICT');
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessable(message, errors = null) {
    return new ApiError(422, message, errors, 'UNPROCESSABLE_ENTITY');
  }

  /**
   * Create a 500 Internal Server error
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, 'INTERNAL_ERROR');
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(503, message, null, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Format error response
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorResponse = (err, res) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    error: err.name || 'Error',
    message: err.message || 'An error occurred',
    code: err.code || 'ERROR',
    timestamp: new Date().toISOString(),
  };

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Express error handling middleware
 * Catches all errors and sends consistent response
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id || 'anonymous',
  };

  // Only log stack in development
  if (process.env.NODE_ENV === 'development') {
    errorLog.stack = err.stack;
  }

  console.error('❌ Error:', JSON.stringify(errorLog, null, 2));

  // Handle specific error types

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    return sendErrorResponse(
      new ApiError(400, 'Validation Error', errors, 'VALIDATION_ERROR'),
      res
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || 'value';
    return sendErrorResponse(
      new ApiError(400, `${field} '${value}' already exists`, null, 'DUPLICATE_KEY'),
      res
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendErrorResponse(
      new ApiError(400, `Invalid ${err.path}: ${err.value}`, null, 'INVALID_ID'),
      res
    );
  }

  // Mongoose strict mode error
  if (err.name === 'StrictModeError') {
    return sendErrorResponse(
      new ApiError(400, `Unknown field: ${err.path}`, null, 'UNKNOWN_FIELD'),
      res
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(
      new ApiError(401, 'Invalid token', null, 'INVALID_TOKEN'),
      res
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(
      new ApiError(401, 'Token expired', null, 'TOKEN_EXPIRED'),
      res
    );
  }

  if (err.name === 'NotBeforeError') {
    return sendErrorResponse(
      new ApiError(401, 'Token not yet valid', null, 'TOKEN_NOT_ACTIVE'),
      res
    );
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    let message = `File upload error: ${err.message}`;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected file field: ${err.field}`;
        break;
    }

    return sendErrorResponse(
      new ApiError(400, message, null, err.code),
      res
    );
  }

  // Syntax error in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendErrorResponse(
      new ApiError(400, 'Invalid JSON in request body', null, 'INVALID_JSON'),
      res
    );
  }

  // Rate limit exceeded
  if (err.status === 429) {
    return sendErrorResponse(
      new ApiError(429, err.message || 'Too many requests', null, 'RATE_LIMIT_EXCEEDED'),
      res
    );
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return sendErrorResponse(
      new ApiError(403, 'CORS error: Origin not allowed', null, 'CORS_ERROR'),
      res
    );
  }

  // Default to 500 server error
  sendErrorResponse(
    err.isOperational ? err : new ApiError(500, 'Internal server error'),
    res
  );
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found error handler
 * Creates 404 error for unmatched routes
 */
const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Validation error formatter
 * Converts express-validator errors to consistent format
 * @param {Array} errors - express-validator error array
 * @returns {Array} Formatted errors
 */
const formatValidationErrors = (errors) => {
  return errors.map(err => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value,
    location: err.location,
  }));
};

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler,
  notFound,
  sendErrorResponse,
  formatValidationErrors,
};

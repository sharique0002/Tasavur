require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./utils/errorHandler');
const { sanitizeMiddleware } = require('./utils/sanitizer');

/**
 * Business Incubator Platform - Main Server
 * Handles Express app initialization, middleware, routes, and Socket.IO
 */

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://tasavur-lbcm.vercel.app', process.env.FRONTEND_URL].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join user-specific room for targeted notifications
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    }
  });

  // Join startup-specific room
  socket.on('join:startup', (startupId) => {
    if (startupId) {
      socket.join(`startup:${startupId}`);
      console.log(`🚀 Joined startup room: ${startupId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error.message);
  });
});

// Connect to MongoDB (skip in test environment - tests setup their own in-memory DB)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Security middleware - Set security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration - allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:5173', // Local development frontend
  'http://localhost:3000',
  'http://localhost:5000', // Same-origin when served together
  process.env.FRONTEND_URL,
  'https://tasavur-lbcm.vercel.app', // Vercel deployment
  'https://tasavur.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check allowed origins or allow *.vercel.app domains
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting - protect against brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 100, // Higher limit for tests
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test', // Skip rate limit in tests
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 10, // 10 attempts per 15 min
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Input sanitization middleware
app.use(sanitizeMiddleware);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 ${timestamp} ${req.method} ${req.path}`);
    next();
  });
}

// Serve static files (for local uploads)
app.use('/uploads', express.static('uploads'));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '../frontend_vite/dist');
  
  app.use(express.static(frontendPath));
  console.log('📦 Serving frontend from:', frontendPath);
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Health check for Render deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/startups', require('./routes/startup'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/resources', require('./routes/resource'));
app.use('/api/funding', require('./routes/funding'));

// Root route - serve frontend
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    res.sendFile(path.join(__dirname, '../frontend_vite/dist/index.html'));
  } else {
    res.json({
      success: true,
      message: 'Tasavur Business Incubator API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/health',
        auth: '/api/auth',
        startups: '/api/startups',
        dashboard: '/api/dashboard',
        mentorship: '/api/mentorship',
        resources: '/api/resources',
        funding: '/api/funding'
      }
    });
  }
});

// Serve frontend index.html for all non-API routes (SPA support)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend_vite/dist/index.html'));
  });
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB',
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed',
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 5000;

// Start server (skip in test environment and Vercel serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 Business Incubator Platform Server`);
    console.log(`📍 Running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.IO enabled for real-time updates`);
    console.log('='.repeat(60));
  });
}

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'test') {
    // Give time for logging before exit
    setTimeout(() => {
      server.close(() => process.exit(1));
    }, 1000);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;

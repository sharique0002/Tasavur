const mongoose = require('mongoose');

/**
 * Database Connection Configuration
 * Handles MongoDB connection with retry logic and event handling
 */

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Connect to MongoDB database
 * Implements retry logic and proper error handling
 */
const connectDB = async () => {
  // Prevent multiple connection attempts
  if (isConnected) {
    console.log('✅ Already connected to MongoDB');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.warn('⚠️  Please set MONGODB_URI in your .env file');
    console.warn('⚠️  Example: MONGODB_URI=mongodb://localhost:27017/incubator');
    return;
  }

  // Mongoose connection options
  const options = {
    maxPoolSize: 10, // Maximum connection pool size
    serverSelectionTimeoutMS: 30000, // Timeout for server selection (30s for cold start)
    socketTimeoutMS: 45000, // Timeout for socket operations
    connectTimeoutMS: 30000, // Connection timeout (30s)
    family: 4, // Use IPv4        
  };

  try {
    connectionAttempts++;
    console.log(`🔄 Connecting to MongoDB (attempt ${connectionAttempts}/${MAX_RETRIES})...`);

    const conn = await mongoose.connect(mongoUri, options);

    isConnected = true;
    connectionAttempts = 0; // Reset on success
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // ==========================================================================
    // CONNECTION EVENT HANDLERS
    // ==========================================================================

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;

      // Attempt reconnection if not in test mode
      if (process.env.NODE_ENV !== 'test') {
        console.log('🔄 Attempting to reconnect...');
        setTimeout(connectDB, RETRY_DELAY);
      }
    });

    // Handle successful reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    // Handle connection close
    mongoose.connection.on('close', () => {
      console.log('📴 MongoDB connection closed');
      isConnected = false;
    });

    // Log when indexes are built
    mongoose.connection.on('index', (err) => {
      if (err) {
        console.error('❌ Index creation error:', err.message);
      }
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    isConnected = false;

    // Retry logic
    if (connectionAttempts < MAX_RETRIES && process.env.NODE_ENV !== 'test') {
      console.log(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB();
    }

    // Max retries reached
    if (connectionAttempts >= MAX_RETRIES) {
      console.error(`❌ Failed to connect after ${MAX_RETRIES} attempts`);
      console.warn('⚠️  Server will run without database connection');
      console.warn('⚠️  API endpoints requiring database will not work');
    }

    // Provide helpful instructions
    console.warn('\n📋 Troubleshooting steps:');
    console.warn('1. Ensure MongoDB is installed and running');
    console.warn('2. Check your MONGODB_URI in .env file');
    console.warn('3. Verify network connectivity');
    console.warn('4. Download MongoDB from: https://www.mongodb.com/try/download/community\n');
  }
};

/**
 * Close database connection gracefully
 * Used for cleanup during shutdown
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('📴 MongoDB connection closed gracefully');
  }
};

/**
 * Get connection status
 * @returns {boolean} Whether database is connected
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
module.exports.getConnectionStatus = getConnectionStatus;

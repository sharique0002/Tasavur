/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel deployment
 */

// Load environment variables
require('dotenv').config({ path: '../backend/.env' });

// Import the Express app
const app = require('../backend/server');

// Export for Vercel serverless function
module.exports = app;

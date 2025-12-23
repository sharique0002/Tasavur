/**
 * Admin Seeder Script
 * Creates a default admin account for the Business Incubator Platform
 * 
 * Run with: node seeders/adminSeeder.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Admin credentials
const ADMIN_CREDENTIALS = {
    name: 'Super Admin',
    email: 'admin@tasavur.com',
    password: 'Admin@123',
    role: 'admin',
    verified: true,
    isActive: true,
};

async function seedAdmin() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-incubator';

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Email: ${ADMIN_CREDENTIALS.email}`);
            console.log(`   Role: ${existingAdmin.role}`);

            // Update role to admin if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated user role to admin');
            }
        } else {
            // Create new admin user
            const admin = await User.create(ADMIN_CREDENTIALS);
            console.log('✅ Admin user created successfully!');
            console.log('');
            console.log('╔══════════════════════════════════════════╗');
            console.log('║         ADMIN LOGIN CREDENTIALS          ║');
            console.log('╠══════════════════════════════════════════╣');
            console.log(`║  Email:    ${ADMIN_CREDENTIALS.email}       ║`);
            console.log(`║  Password: ${ADMIN_CREDENTIALS.password}              ║`);
            console.log('╚══════════════════════════════════════════╝');
            console.log('');
        }

        // Disconnect
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
}

// Run seeder
seedAdmin();

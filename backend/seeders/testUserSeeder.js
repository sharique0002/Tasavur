/**
 * Test User Seeder Script
 * Creates a test founder account for development and testing
 * 
 * Run with: node seeders/testUserSeeder.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Test user credentials
const TEST_USERS = [
    {
        name: 'Test User',
        email: 'user@tasavur.com',
        password: 'User@123',
        role: 'founder',
        verified: true,
        isActive: true,
    },
    {
        name: 'Test Mentor',
        email: 'mentor@tasavur.com',
        password: 'Mentor@123',
        role: 'mentor',
        verified: true,
        isActive: true,
    },
    {
        name: 'Test Investor',
        email: 'investor@tasavur.com',
        password: 'Investor@123',
        role: 'investor',
        verified: true,
        isActive: true,
    }
];

async function seedTestUsers() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-incubator';

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        console.log('');
        console.log('╔══════════════════════════════════════════╗');
        console.log('║       CREATING TEST USER ACCOUNTS        ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');

        for (const userData of TEST_USERS) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⚠️  ${userData.role.toUpperCase()} user already exists!`);
                console.log(`   Email: ${userData.email}`);
                console.log(`   Role: ${existingUser.role}`);
                console.log('');
            } else {
                // Create new test user
                await User.create(userData);
                console.log(`✅ ${userData.role.toUpperCase()} user created successfully!`);
                console.log(`   Email:    ${userData.email}`);
                console.log(`   Password: ${userData.password}`);
                console.log(`   Role:     ${userData.role}`);
                console.log('');
            }
        }

        console.log('╔══════════════════════════════════════════╗');
        console.log('║          TEST CREDENTIALS SUMMARY         ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log('║  FOUNDER:                                ║');
        console.log('║    Email: user@tasavur.com               ║');
        console.log('║    Pass:  User@123                       ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log('║  MENTOR:                                 ║');
        console.log('║    Email: mentor@tasavur.com             ║');
        console.log('║    Pass:  Mentor@123                     ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log('║  INVESTOR:                               ║');
        console.log('║    Email: investor@tasavur.com           ║');
        console.log('║    Pass:  Investor@123                   ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');

        // Disconnect
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('✅ Test users seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding test users:', error.message);
        process.exit(1);
    }
}

// Run seeder
seedTestUsers();

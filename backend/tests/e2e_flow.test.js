// Set test environment BEFORE any imports
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

// Basic secrets for JWT during tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

let mongoServer;

beforeAll(async () => {
  // Disconnect existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clean DB between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('End-to-end user founder submission and admin approval flow', () => {
  it('should allow founder to submit a startup and admin to approve it', async () => {
    // Register founder
    const founderReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Founder One',
        email: 'founder1@example.com',
        password: 'Strong123',
        role: 'founder',
      })
      .expect(201);

    // Login founder
    const founderLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'founder1@example.com', password: 'Strong123' })
      .expect(200);
    const founderToken = founderLogin.body.token;

    // Submit startup as founder
    const startupPayload = {
      name: 'Alpha Startup',
      shortDesc: 'Building innovative solutions for SMEs.',
      domain: 'SaaS',
      stage: 'MVP',
      founders: [
        { name: 'Founder One', email: 'founder1@example.com', role: 'CEO' },
      ],
      contact: { email: 'contact@alpha.example.com', phone: '+1234567890' },
      website: 'https://alpha.example.com',
      tags: ['innovation', 'b2b'],
    };

    const startupRes = await request(app)
      .post('/api/startups')
      .set('Authorization', `Bearer ${founderToken}`)
      .send(startupPayload);

    // Debug output if validation fails
    if (startupRes.statusCode !== 201) {
      // eslint-disable-next-line no-console
      console.log('Startup creation error body:', startupRes.body);
    }

    expect(startupRes.statusCode).toBe(201);
    expect(startupRes.body.success).toBe(true);
    const startupId = startupRes.body.data._id;

    // Create admin directly in DB (since public registration disallows admin role)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'AdminStrong123',
      role: 'admin',
      verified: true,
    });

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminStrong123' })
      .expect(200);
    const adminToken = adminLogin.body.token;

    // Approve startup
    const approveRes = await request(app)
      .put(`/api/startups/${startupId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Approved', reason: 'Meets program criteria' })
      .expect(200);

    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.status).toBe('Approved');
  });
});

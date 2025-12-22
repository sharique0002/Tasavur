// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_ci';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Startup = require('../models/Startup');

let mongoServer;
let authToken;
let testUser;
let testStartup;

/**
 * Test Suite for Startup API Routes
 */
describe('Startup API Routes', () => {
  // Setup: Start in-memory MongoDB and create test user
  beforeAll(async () => {
    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      name: 'Test Founder',
      email: 'test@example.com',
      password: 'password123',
      role: 'founder',
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginRes.body.token;
  });

  // Cleanup: Close database connection
  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // Clear collections after each test
  afterEach(async () => {
    await Startup.deleteMany({});
    // Clean up test users except the main test user
    await User.deleteMany({ email: { $ne: 'test@example.com' } });
  });

  describe('POST /api/startups', () => {
    it('should create a new startup with valid data', async () => {
      const startupData = {
        name: 'Test Startup',
        shortDesc: 'A test startup description',
        domain: 'FinTech',
        stage: 'Idea',
        founders: [{ name: 'John Doe', email: 'john@example.com' }],
        contact: { email: 'contact@test.com' },
      };

      const res = await request(app)
        .post('/api/startups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(startupData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(startupData.name);
      expect(res.body.data.domain).toBe(startupData.domain);

      testStartup = res.body.data;
    });

    it('should fail without required fields', async () => {
      const invalidData = {
        name: 'Test Startup',
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/startups')
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidData = {
        name: 'Test Startup',
        shortDesc: 'Description',
        domain: 'FinTech',
        stage: 'Idea',
        founders: [{ name: 'John', email: 'invalid-email' }],
        contact: { email: 'invalid-email' },
      };

      const res = await request(app)
        .post('/api/startups')
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/startups', () => {
    beforeEach(async () => {
      // Create test startups
      await Startup.create([
        {
          name: 'FinTech Startup',
          shortDesc: 'A fintech solution',
          domain: 'FinTech',
          stage: 'MVP',
          founders: [{ name: 'Alice', email: 'alice@example.com' }],
          contact: { email: 'contact@fintech.com' },
          status: 'Active',
        },
        {
          name: 'HealthTech Startup',
          shortDesc: 'A healthtech solution',
          domain: 'HealthTech',
          stage: 'Idea',
          founders: [{ name: 'Bob', email: 'bob@example.com' }],
          contact: { email: 'contact@healthtech.com' },
          status: 'Pending',
        },
      ]);
    });

    it('should get all startups', async () => {
      const res = await request(app).get('/api/startups');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.count).toBe(2);
    });

    it('should filter by domain', async () => {
      const res = await request(app).get('/api/startups?domain=FinTech');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].domain).toBe('FinTech');
    });

    it('should filter by stage', async () => {
      const res = await request(app).get('/api/startups?stage=MVP');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].stage).toBe('MVP');
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/startups?status=Active');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('Active');
    });

    it('should search by name', async () => {
      const res = await request(app).get('/api/startups?search=FinTech');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const res = await request(app).get('/api/startups?page=1&limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(2);
    });
  });

  describe('GET /api/startups/:id', () => {
    beforeEach(async () => {
      testStartup = await Startup.create({
        name: 'Test Startup',
        shortDesc: 'Description',
        domain: 'SaaS',
        stage: 'Growth',
        founders: [{ name: 'Charlie', email: 'charlie@example.com' }],
        contact: { email: 'contact@test.com' },
      });
    });

    it('should get startup by ID', async () => {
      const res = await request(app).get(`/api/startups/${testStartup._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testStartup._id.toString());
      expect(res.body.data.name).toBe('Test Startup');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/startups/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/startups/:id', () => {
    beforeEach(async () => {
      testStartup = await Startup.create({
        founder: testUser._id,
        name: 'Test Startup',
        shortDesc: 'Description',
        domain: 'SaaS',
        stage: 'Growth',
        founders: [{ name: 'Test', email: 'test@example.com' }],
        contact: { email: 'contact@test.com' },
      });
    });

    it('should update startup with valid data', async () => {
      const updateData = {
        name: 'Updated Startup Name',
        stage: 'Scale-up',
      };

      const res = await request(app)
        .put(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Startup Name');
      expect(res.body.data.stage).toBe('Scale-up');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put(`/api/startups/${testStartup._id}`)
        .send({ name: 'New Name' });

      expect(res.statusCode).toBe(401);
    });

    it('should fail if not the founder', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: 'password123' });

      const otherToken = loginRes.body.token;

      const res = await request(app)
        .put(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/startups/:id', () => {
    let adminToken;

    beforeEach(async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' });

      adminToken = loginRes.body.token;

      testStartup = await Startup.create({
        name: 'To Delete',
        shortDesc: 'Description',
        domain: 'Other',
        stage: 'Idea',
        founders: [{ name: 'Delete', email: 'delete@example.com' }],
        contact: { email: 'contact@delete.com' },
      });
    });

    it('should delete startup as admin', async () => {
      const res = await request(app)
        .delete(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const checkRes = await request(app).get(`/api/startups/${testStartup._id}`);
      expect(checkRes.statusCode).toBe(404);
    });

    it('should fail without admin role', async () => {
      const res = await request(app)
        .delete(`/api/startups/${testStartup._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});

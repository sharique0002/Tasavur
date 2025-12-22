// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_ci';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Resource = require('../models/Resource');
const User = require('../models/User');

let mongoServer;
let adminToken;
let mentorToken;
let founderToken;
let adminUser;
let mentorUser;
let founderUser;

// Setup in-memory MongoDB
beforeAll(async () => {
  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test users
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  });

  mentorUser = await User.create({
    name: 'Mentor User',
    email: 'mentor@test.com',
    password: 'password123',
    role: 'mentor'
  });

  founderUser = await User.create({
    name: 'Founder User',
    email: 'founder@test.com',
    password: 'password123',
    role: 'founder'
  });

  // Generate tokens
  adminToken = adminUser.getSignedJwtToken();
  mentorToken = mentorUser.getSignedJwtToken();
  founderToken = founderUser.getSignedJwtToken();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await Resource.deleteMany();
  // Clean up extra test users created in tests
  await User.deleteMany({
    email: { $nin: ['admin@test.com', 'mentor@test.com', 'founder@test.com'] }
  });
});

describe('Resource API Tests', () => {
  describe('POST /api/resources - Create Resource', () => {
    it('should allow admin to create resource', async () => {
      const resourceData = {
        title: 'Test Template',
        type: 'Template',
        description: 'A test template resource',
        tags: ['test', 'template'], // Array, not stringified
        visibility: 'Public',
        featured: false
      };

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(resourceData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(resourceData.title);
      expect(res.body.data.type).toBe(resourceData.type);
      expect(res.body.data.createdBy._id).toBe(adminUser._id.toString());
    });

    it('should allow mentor to create resource', async () => {
      const resourceData = {
        title: 'Mentor Course',
        type: 'Course',
        description: 'A course by mentor',
        tags: ['course'],
        visibility: 'Members Only',
        featured: false
      };

      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(resourceData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.createdBy._id).toBe(mentorUser._id.toString());
    });

    it('should deny founder from creating resource', async () => {
      const resourceData = {
        title: 'Founder Resource',
        type: 'Guide',
        description: 'Should not be allowed',
        tags: ['test'],
        visibility: 'Public'
      };

      await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${founderToken}`)
        .send(resourceData)
        .expect(403);
    });

    it('should require authentication', async () => {
      const resourceData = {
        title: 'Unauthenticated',
        type: 'Other',
        description: 'Should fail',
        visibility: 'Public'
      };

      await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing fields' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/resources - Get All Resources', () => {
    beforeEach(async () => {
      // Create test resources
      await Resource.create([
        {
          title: 'Public Resource',
          type: 'Template',
          description: 'Public template',
          visibility: 'Public',
          createdBy: adminUser._id,
          tags: ['public', 'template'],
          status: 'Published'
        },
        {
          title: 'Members Only Resource',
          type: 'Course',
          description: 'Members course',
          visibility: 'Members Only',
          createdBy: mentorUser._id,
          tags: ['members', 'course'],
          status: 'Published'
        },
        {
          title: 'Private Resource',
          type: 'Guide',
          description: 'Private guide',
          visibility: 'Private',
          createdBy: adminUser._id,
          tags: ['private'],
          status: 'Published'
        }
      ]);
    });

    it('should return public resources for unauthenticated users', async () => {
      const res = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].visibility).toBe('Public');
    });

    it('should return public and members-only resources for authenticated users', async () => {
      const res = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${founderToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/resources?type=Template')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.every(r => r.type === 'Template')).toBe(true);
    });

    it('should filter by tag', async () => {
      const res = await request(app)
        .get('/api/resources?tag=template') // Use 'tag' not 'tags'
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should search resources', async () => {
      const res = await request(app)
        .get('/api/resources?search=template')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/resources?page=1&limit=2')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBeDefined();
    });
  });

  describe('GET /api/resources/:id - Get Single Resource', () => {
    let publicResource;
    let privateResource;

    beforeEach(async () => {
      publicResource = await Resource.create({
        title: 'Public Resource',
        type: 'Template',
        description: 'Public template',
        visibility: 'Public',
        createdBy: adminUser._id,
        status: 'Published'
      });

      privateResource = await Resource.create({
        title: 'Private Resource',
        type: 'Guide',
        description: 'Private guide',
        visibility: 'Private',
        createdBy: adminUser._id,
        status: 'Published'
      });
    });

    it('should return public resource', async () => {
      const res = await request(app)
        .get(`/api/resources/${publicResource._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(publicResource.title);
    });

    it('should deny access to private resource for non-owner', async () => {
      await request(app)
        .get(`/api/resources/${privateResource._id}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .expect(403);
    });

    it('should allow owner access to private resource', async () => {
      const res = await request(app)
        .get(`/api/resources/${privateResource._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(privateResource._id.toString());
    });

    it('should increment view count', async () => {
      await request(app)
        .get(`/api/resources/${publicResource._id}`)
        .expect(200);

      // Wait for async view recording
      await new Promise(resolve => setTimeout(resolve, 100));

      const updated = await Resource.findById(publicResource._id);
      expect(updated.viewCount).toBe(1);
    });
  });

  describe('PUT /api/resources/:id - Update Resource', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'Original Title',
        type: 'Template',
        description: 'Original description',
        visibility: 'Public',
        createdBy: mentorUser._id,
        status: 'Published'
      });
    });

    it('should allow creator to update own resource', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.description).toBe(updateData.description);
    });

    it('should allow admin to update any resource', async () => {
      const updateData = {
        featured: true
      };

      const res = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.featured).toBe(true);
    });

    it('should deny non-creator mentor from updating', async () => {
      // Create another mentor
      const anotherMentor = await User.create({
        name: 'Another Mentor',
        email: 'mentor2@test.com',
        password: 'password123',
        role: 'mentor'
      });
      const anotherToken = anotherMentor.getSignedJwtToken();

      await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ title: 'Should fail' })
        .expect(403);
    });
  });

  describe('DELETE /api/resources/:id - Delete Resource', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'To Delete',
        type: 'Other',
        description: 'Will be deleted',
        visibility: 'Public',
        createdBy: mentorUser._id,
        status: 'Published'
      });
    });

    it('should allow creator to delete own resource', async () => {
      await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      const deleted = await Resource.findById(resource._id);
      expect(deleted).toBeNull();
    });

    it('should allow admin to delete any resource', async () => {
      await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deleted = await Resource.findById(resource._id);
      expect(deleted).toBeNull();
    });

    it('should deny founder from deleting', async () => {
      await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${founderToken}`)
        .expect(403);
    });
  });

  describe('POST /api/resources/:id/download - Record Download', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'Downloadable',
        type: 'Template',
        description: 'Has file',
        visibility: 'Public',
        fileUrl: 'https://example.com/file.pdf',
        createdBy: adminUser._id,
        status: 'Published'
      });
    });

    it('should record download and return URL', async () => {
      const res = await request(app)
        .post(`/api/resources/${resource._id}/download`)
        .set('Authorization', `Bearer ${founderToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBeDefined();

      const updated = await Resource.findById(resource._id);
      expect(updated.downloadCount).toBe(1);
    });

    it('should work for unauthenticated users on public resources', async () => {
      const res = await request(app)
        .post(`/api/resources/${resource._id}/download`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should deny unauthenticated download of members-only resource', async () => {
      resource.visibility = 'Members Only';
      await resource.save();

      await request(app)
        .post(`/api/resources/${resource._id}/download`)
        .expect(401); // Unauthenticated returns 401
    });
  });

  describe('GET /api/resources/popular - Get Popular Resources', () => {
    beforeEach(async () => {
      await Resource.create([
        {
          title: 'Popular 1',
          type: 'Template',
          description: 'Most popular',
          visibility: 'Public',
          createdBy: adminUser._id,
          downloadCount: 100,
          viewCount: 200,
          status: 'Published'
        },
        {
          title: 'Popular 2',
          type: 'Course',
          description: 'Second popular',
          visibility: 'Public',
          createdBy: adminUser._id,
          downloadCount: 50,
          viewCount: 100,
          status: 'Published'
        }
      ]);
    });

    it('should return popular resources sorted by engagement', async () => {
      const res = await request(app)
        .get('/api/resources/popular?limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].downloadCount).toBeGreaterThanOrEqual(res.body.data[1]?.downloadCount || 0);
    });
  });

  describe('GET /api/resources/tags - Get All Tags', () => {
    beforeEach(async () => {
      await Resource.create([
        {
          title: 'Tagged 1',
          type: 'Template',
          description: 'Has tags',
          visibility: 'Public',
          createdBy: adminUser._id,
          tags: ['fundraising', 'pitch'],
          status: 'Published'
        },
        {
          title: 'Tagged 2',
          type: 'Course',
          description: 'Has tags',
          visibility: 'Public',
          createdBy: adminUser._id,
          tags: ['marketing', 'growth'],
          status: 'Published'
        }
      ]);
    });

    it('should return all unique tags', async () => {
      const res = await request(app)
        .get('/api/resources/tags')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data).toContain('fundraising');
      expect(res.body.data).toContain('marketing');
    });
  });
});

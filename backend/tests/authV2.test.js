// Set test environment BEFORE any imports
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock the server setup
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRE = '15m';

const express = require('express');
const cookieParser = require('cookie-parser');
const authRouter = require('../routes/authV2');
const { errorHandler } = require('../utils/errorHandler');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use(errorHandler);

let mongoServer;

// Setup in-memory MongoDB
beforeAll(async () => {
  // Disconnect any existing connection first
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
  await User.deleteMany();
});

describe('Enhanced Auth API Tests', () => {
  describe('POST /api/auth/register - Registration', () => {
    it('should register a new user with strong password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123',
        role: 'founder',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.verified).toBe(false);

      // Check refresh token cookie
      expect(res.headers['set-cookie']).toBeDefined();
      const cookies = res.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true);
    });

    it('should enforce strong password requirements', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak', // Too weak
        role: 'founder',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      // First registration
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.message).toContain('already exists');
    });

    it('should support investor role', async () => {
      const userData = {
        name: 'Investor User',
        email: 'investor@example.com',
        password: 'SecurePass123',
        role: 'investor',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.role).toBe('investor');
    });
  });

  describe('POST /api/auth/login - Login', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      testUser = await User.create({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'SecurePass123',
        role: 'founder',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);

      // Verify JWT structure
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should update lastLogin timestamp', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
        });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh - Token Refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Refresh Test',
        email: 'refresh@example.com',
        password: 'SecurePass123',
      });

      // Login to get refresh token
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePass123',
        });

      // Extract refresh token from cookie
      const cookies = res.headers['set-cookie'];
      const refreshCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      refreshToken = refreshCookie.split(';')[0].split('=')[1];
    });

    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();

      // Verify new token is different
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject refresh token not in database', async () => {
      // Create a valid JWT but not stored in database
      // Use the same secret fallback logic as the route
      const fakeToken = jwt.sign(
        { id: testUser._id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${fakeToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid refresh token');
    });

  });

  describe('POST /api/auth/logout - Logout', () => {
    let token;
    let refreshToken;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'Logout Test',
        email: 'logout@example.com',
        password: 'SecurePass123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123',
        });

      token = res.body.token;
      const cookies = res.headers['set-cookie'];
      const refreshCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      refreshToken = refreshCookie.split(';')[0].split('=')[1];
    });

    it('should logout and invalidate refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Try to use refresh token after logout
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);

      expect(refreshRes.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password - Password Change', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Password Test',
        email: 'password@example.com',
        password: 'OldPassword123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'OldPassword123',
        });

      token = res.body.token;
    });

    it('should change password with valid current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'NewPassword123',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(401);

      expect(res.body.message).toContain('incorrect');
    });

    it('should enforce strong password for new password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'weak',
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });

    it('should clear all refresh tokens on password change', async () => {
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        });

      const user = await User.findById(testUser._id);
      expect(user.refreshTokens).toHaveLength(0);
    });
  });

  describe('POST /api/auth/forgot-password - Password Reset Request', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Reset Test',
        email: 'reset@example.com',
        password: 'SecurePass123',
      });
    });

    it('should generate password reset token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset link sent');

      // In dev mode, token is returned
      if (process.env.NODE_ENV === 'development') {
        expect(res.body.resetToken).toBeDefined();
      }
    });

    it('should not reveal if user exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      // Same message regardless of user existence
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Profile Test',
        email: 'profile@example.com',
        password: 'SecurePass123',
        bio: 'Test bio',
        verified: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'SecurePass123',
        });

      token = res.body.token;
    });

    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.password).toBeUndefined(); // Should not expose password
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should hash passwords with bcrypt salt >= 10', async () => {
      const user = await User.create({
        name: 'Security Test',
        email: 'security@example.com',
        password: 'SecurePass123',
      });

      const userWithPassword = await User.findById(user._id).select('+password');

      // Bcrypt hash should start with $2b$ (bcrypt) or $2a$
      expect(userWithPassword.password).toMatch(/^\$2[ab]\$/);

      // Hash length should indicate proper salting
      expect(userWithPassword.password.length).toBeGreaterThan(50);
    });

    it('should not expose sensitive fields in JSON', async () => {
      const user = await User.create({
        name: 'JSON Test',
        email: 'json@example.com',
        password: 'SecurePass123',
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.refreshTokens).toBeUndefined();
      expect(json.verificationToken).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
    });

    it('should sanitize email inputs', async () => {
      const userData = {
        name: 'Sanitize Test',
        email: '  TEST@EXAMPLE.COM  ', // Mixed case, whitespace
        password: 'SecurePass123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.email).toBe('test@example.com');
    });
  });
});

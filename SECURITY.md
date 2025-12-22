# Backend API Security Guide

## Overview

The Business Incubator Platform implements enterprise-grade security measures for authentication, authorization, and API protection.

## Security Features

### 1. Authentication & Tokens

#### JWT Access Tokens
- **Short TTL**: 15 minutes (configurable via `JWT_EXPIRE`)
- **Payload**: User ID only
- **Usage**: Bearer token in Authorization header
- **Storage**: Client-side (memory or sessionStorage, NOT localStorage for security)

#### Refresh Tokens
- **Long TTL**: 30 days (hardcoded)
- **Storage**: HTTP-only cookie (prevents XSS attacks)
- **Database Tracking**: Stored in user document
- **Rotation**: Old tokens removed on logout/password change
- **Limit**: Maximum 5 active refresh tokens per user

### 2. Password Security

#### Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)`

#### Hashing
- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (configurable via `BCRYPT_SALT_ROUNDS`)
- **Minimum**: 10 rounds (enforced)

### 3. Role-Based Access Control (RBAC)

#### Roles
- **founder**: Startup founders, can manage own startups
- **mentor**: Mentors, can create/manage mentorship offerings
- **investor**: Investors, can view startups and resources
- **admin**: Full access to all features

#### Middleware Usage
```javascript
// Require authentication
router.get('/protected', protect, handler);

// Require specific role(s)
router.post('/admin-only', protect, authorize('admin'), handler);
router.get('/mentor-or-admin', protect, authorize('mentor', 'admin'), handler);
```

### 4. Input Sanitization

All inputs are automatically sanitized to prevent:
- XSS (Cross-Site Scripting) attacks
- SQL/NoSQL injection
- HTML injection

#### Sanitization Features
- HTML tag removal via `validator.escape()`
- Email normalization
- URL validation
- MongoDB query operator blocking (`$` prefix)
- Whitespace trimming

#### Middleware Application
```javascript
// Applied globally in server.js
app.use(sanitizeMiddleware);
```

### 5. Rate Limiting

#### Login Endpoint
- **Window**: 15 minutes
- **Limit**: 5 attempts per IP
- **Message**: "Too many login attempts, please try again after 15 minutes"

#### Registration Endpoint
- **Window**: 1 hour
- **Limit**: 3 registrations per IP
- **Message**: "Too many accounts created, please try again later"

#### Password Reset
- **Window**: 1 hour
- **Limit**: 3 requests per IP
- **Message**: "Too many password reset requests, please try again later"

#### Global API Limit
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Applies to**: All `/api/*` routes

### 6. Security Headers (Helmet)

Automatically set via helmet middleware:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `X-XSS-Protection`

### 7. CORS (Cross-Origin Resource Sharing)

```javascript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
})
```

### 8. Error Handling

#### Consistent Error Format
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "errors": [/* validation errors if applicable */]
}
```

#### Security Considerations
- Stack traces only in development mode
- Generic messages for auth failures
- No user existence leaks (password reset)

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "founder"
}
```

**Response**: Access token + refresh token cookie

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response**: Access token + refresh token cookie

#### Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=<token>
```

**Response**: New access token

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Cookie: refreshToken=<token>
```

**Effect**: Invalidates refresh token, clears cookie

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "John Updated",
  "bio": "New bio",
  "phone": "+1234567890"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Effect**: Clears all refresh tokens (forces re-login on all devices)

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response**: Always 200 (doesn't reveal user existence)

#### Reset Password
```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123"
}
```

**Effect**: Clears all refresh tokens

#### Verify Email
```http
POST /api/auth/verify-email/:token
```

#### Resend Verification
```http
POST /api/auth/resend-verification
Authorization: Bearer <access-token>
```

## Environment Variables

### Required
```env
JWT_SECRET=<min-32-char-random-string>
JWT_REFRESH_SECRET=<min-32-char-random-string>
MONGODB_URI=mongodb://...
```

### Optional
```env
JWT_EXPIRE=15m
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=http://localhost:5173
```

## Best Practices

### Client-Side
1. Store access token in memory or sessionStorage
2. Never store tokens in localStorage (XSS risk)
3. Refresh token automatically before expiry
4. Clear tokens on logout
5. Handle 401 errors by refreshing or redirecting to login

### Server-Side
1. Always validate and sanitize inputs
2. Use `asyncHandler` wrapper for error handling
3. Log security events (failed logins, etc.)
4. Rotate secrets regularly
5. Monitor rate limit violations

### Token Management
```javascript
// Example client-side token refresh
async function refreshAccessToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Include cookies
  });
  
  if (response.ok) {
    const { token } = await response.json();
    // Store new access token
    return token;
  }
  
  // Redirect to login if refresh fails
  window.location.href = '/login';
}
```

## Security Checklist

- [x] Password hashing with bcrypt (salt >= 10)
- [x] JWT access tokens with short TTL
- [x] HTTP-only refresh token cookies
- [x] Input sanitization on all endpoints
- [x] Rate limiting on auth endpoints
- [x] RBAC middleware for authorization
- [x] Helmet security headers
- [x] CORS whitelist configuration
- [x] Error handling without info leaks
- [x] Email verification system
- [x] Password reset with token expiry
- [x] Token rotation on password change
- [x] Account deactivation support
- [x] Consistent error format

## Monitoring & Logging

### Log Security Events
- Failed login attempts
- Password changes
- Password reset requests
- Account verifications
- Rate limit violations
- Invalid token usage

### Recommended Tools
- Winston for structured logging
- Sentry for error tracking
- New Relic for performance monitoring
- Auth0 for managed authentication (alternative)

## Production Deployment

### Before Deploy
1. Generate strong secrets: `openssl rand -base64 32`
2. Set `NODE_ENV=production`
3. Enable HTTPS (required for secure cookies)
4. Configure CORS for production domain
5. Set up email service (SendGrid, AWS SES, etc.)
6. Enable database encryption at rest
7. Set up backup strategy for user data

### Environment-Specific
```env
# Production
NODE_ENV=production
JWT_SECRET=<production-secret>
JWT_REFRESH_SECRET=<production-refresh-secret>
FRONTEND_URL=https://yourdomain.com
```

## Compliance

### GDPR
- User data export capability
- Account deletion support
- Privacy policy acceptance tracking
- Data retention policies

### OWASP Top 10
- ✅ Injection prevention
- ✅ Broken authentication fixes
- ✅ Sensitive data exposure prevention
- ✅ XML external entities (N/A - no XML)
- ✅ Broken access control fixes
- ✅ Security misconfiguration hardening
- ✅ XSS prevention
- ✅ Insecure deserialization (N/A)
- ✅ Using components with known vulnerabilities (keep updated)
- ✅ Insufficient logging & monitoring setup

## Support

For security issues, contact: security@businessincubator.com

**Do not** open public GitHub issues for security vulnerabilities.

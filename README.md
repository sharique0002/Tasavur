# 🚀 Tasavur - Business Incubator Platform

A full-stack MERN (MongoDB, Express, React, Node.js) platform for managing startup incubation programs with AI-powered mentor matching, real-time dashboards, and comprehensive resource management.

![Tech Stack](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Modules Overview](#-modules-overview)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Module 1: Startup Onboarding
- ✅ Multi-step form with validation
- ✅ File upload for pitch decks (AWS S3 or local)
- ✅ Founder information management
- ✅ Optional authentication
- ✅ Automatic user-startup association

### Module 2: Dashboard
- ✅ Real-time updates via Socket.IO
- ✅ Advanced filtering (domain, stage, status)
- ✅ Server-side pagination
- ✅ Admin bulk actions (approve, reject, flag)
- ✅ KPI display (revenue, users, growth, funding)
- ✅ Responsive card-based layout

### Module 3: Mentor Request & Matching Engine
- ✅ AI-powered matching algorithm
- ✅ Score-based ranking (skill, domain, availability, rating)
- ✅ Optional OpenAI semantic matching
- ✅ Session scheduling system
- ✅ Feedback and rating system
- ✅ Mentor availability tracking

### Additional Features
- 🔐 JWT authentication with role-based access
- 📧 Email notifications (configurable)
- 🐳 Docker containerization
- 🔄 CI/CD with GitHub Actions
- 🧪 Comprehensive test suite
- 📊 MongoDB with indexed queries
- 🎨 Beautiful Tailwind UI components

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+)
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **Socket.IO** - Real-time updates
- **OpenAI API** - AI-powered matching (optional)

### Frontend
- **React** (18.x) - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Headless UI** - UI components
- **React Hot Toast** - Notifications
- **Socket.IO Client** - Real-time updates

### DevOps
- **Docker** & **Docker Compose**
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy
- **Jest** & **Supertest** - Testing

## 📁 Project Structure

```
Tasavur/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── upload.js             # File upload (S3/local)
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Startup.js            # Startup model
│   │   ├── Mentor.js             # Mentor model
│   │   ├── MentorshipRequest.js  # Mentorship request model
│   │   ├── FundingApplication.js # Funding application model
│   │   ├── Resource.js           # Resource model
│   │   └── Notification.js       # Notification model
│   ├── routes/
│   │   ├── auth.js               # Authentication routes (with refresh tokens)
│   │   ├── startup.js            # Startup CRUD routes
│   │   ├── dashboard.js          # Dashboard API
│   │   ├── mentorship.js         # Mentorship routes
│   │   ├── funding.js            # Funding routes
│   │   └── resource.js           # Resource routes
│   ├── services/
│   │   └── matchingService.js    # AI matching algorithm
│   ├── seeders/
│   │   └── adminSeeder.js        # Seed admin account
│   ├── utils/
│   │   ├── errorHandler.js       # Error handling utilities
│   │   └── sanitizer.js          # Input sanitization
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── startup.test.js
│   │   ├── resource.test.js
│   │   └── e2e_flow.test.js
│   ├── uploads/                  # Local file uploads
│   ├── server.js                 # Express app entry
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend_vite/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StartupCard.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── AdminControls.jsx
│   │   │   ├── ResourceCard.jsx
│   │   │   └── LaunchAnimation.jsx
│   │   ├── pages/
│   │   │   ├── Onboard.jsx       # Startup registration
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── MentorRequest.jsx # Request mentorship
│   │   │   ├── MyRequests.jsx    # View my requests
│   │   │   ├── ResourceHub.jsx   # Browse resources
│   │   │   ├── ResourceManagement.jsx
│   │   │   ├── FundingApplication.jsx
│   │   │   ├── MyApplications.jsx
│   │   │   ├── StartupDetails.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Privacy.jsx
│   │   │   └── Terms.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios configuration
│   │   ├── store/
│   │   │   └── authStore.js      # Zustand auth store
│   │   ├── assets/               # Static assets
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD
├── docker-compose.yml
├── start-servers.bat             # Windows dev startup script
├── SECURITY.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git
- (Optional) Docker & Docker Compose

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Business Incubator Platform"
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Set MONGODB_URI, JWT_SECRET, etc.

# Create uploads directory
mkdir -p uploads/pitchdecks

# Start development server
npm run dev
```

Backend will run on http://localhost:5000

#### 3. Frontend Setup

```bash
cd frontend_vite

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

### 4. Seed Admin Account

```bash
cd backend

# Create default admin account
node seeders/adminSeeder.js
```

## 🔐 Default Credentials

### Admin Account

| Field | Value |
|-------|-------|
| **Email** | `admin@tasavur.com` |
| **Password** | `Admin@123` |
| **Role** | `admin` |

### Test User Account

| Field | Value |
|-------|-------|
| **Email** | `user@tasavur.com` |
| **Password** | `User@123` |
| **Role** | `founder` |

> **Security Note:** 
> - Change these default passwords after first login in production environments
> - These credentials are for development and testing purposes only
> - Never commit real credentials to version control

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/business-incubator
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/business-incubator

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=incubator-uploads

# OpenAI API (Optional - for AI matching)
OPENAI_API_KEY=your_openai_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Create environment files in backend and frontend_vite folders
# Edit .env files with your configuration

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Individual Docker Images

#### Build Backend
```bash
cd backend
docker build -t incubator-backend .
docker run -p 5000:5000 --env-file .env incubator-backend
```

#### Build Frontend
```bash
cd frontend_vite
docker build -t incubator-frontend .
docker run -p 3000:80 incubator-frontend
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "founder"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "founder" }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Startup Endpoints

#### Create Startup
```http
POST /api/startups
Authorization: Bearer <token>
Content-Type: multipart/form-data

name: "TechCo"
shortDesc: "AI-powered solution"
domain: "AI/ML"
stage: "MVP"
founders: [{"name":"John","email":"john@example.com"}]
contact: {"email":"contact@techco.com"}
pitchDeck: <file>
```

#### Get All Startups
```http
GET /api/startups?page=1&limit=10&domain=FinTech&stage=MVP&search=AI
```

#### Get Single Startup
```http
GET /api/startups/:id
```

#### Update Startup
```http
PUT /api/startups/:id
Authorization: Bearer <token>
```

#### Delete Startup (Admin)
```http
DELETE /api/startups/:id
Authorization: Bearer <token>
```

### Mentorship Endpoints

#### Create Mentorship Request
```http
POST /api/mentorship/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "startupId": "64abc...",
  "topic": "Fundraising Strategy",
  "description": "Need help with seed round",
  "domains": ["FinTech"],
  "skills": ["Fundraising", "Pitching"],
  "urgency": "High"
}
```

#### Get All Requests
```http
GET /api/mentorship/requests?status=Matched
Authorization: Bearer <token>
```

#### Get Request Details
```http
GET /api/mentorship/requests/:id
Authorization: Bearer <token>
```

#### Select Mentor
```http
PUT /api/mentorship/requests/:id/select-mentor
Authorization: Bearer <token>
Content-Type: application/json

{
  "mentorId": "64xyz..."
}
```

#### Schedule Session
```http
POST /api/mentorship/requests/:id/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "mentorId": "64xyz...",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "duration": 60,
  "meetingLink": "https://zoom.us/j/..."
}
```

#### Submit Feedback
```http
PUT /api/mentorship/sessions/:sessionId/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": "64abc...",
  "rating": 5,
  "comment": "Very helpful session!"
}
```

### Dashboard Endpoints

#### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Bulk Action (Admin)
```http
PUT /api/dashboard/bulk-action
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve",
  "startupIds": ["64abc...", "64def..."]
}
```

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm test -- --coverage    # With coverage
```

### Run Frontend Tests

```bash
cd frontend_vite
npm test
```

### Test Coverage

The test suite includes:
- ✅ Authentication flow (register, login, profile)
- ✅ Startup CRUD operations
- ✅ Authorization checks
- ✅ Input validation
- ✅ File upload handling
- ✅ Pagination and filtering
- ✅ Error handling

## 📦 Modules Overview

### Module 1: Startup Onboarding
Beautiful multi-step form for startups to join the incubator. Includes:
- Company information
- Founder details (with dynamic addition)
- Pitch deck upload
- Stage and domain selection
- Client-side and server-side validation

### Module 2: Dashboard
Real-time dashboard with:
- Startup cards with KPIs
- Advanced filtering and search
- Pagination
- Admin bulk actions
- Socket.IO real-time updates
- Responsive grid layout

### Module 3: Mentor Matching Engine
AI-powered matching system featuring:
- Score-based algorithm (skill, domain, availability, rating)
- Optional OpenAI semantic matching
- Top-N recommendations
- Session scheduling
- Feedback loop for continuous improvement
- Mentor availability management

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation with express-validator
- Security headers (Helmet)
- CORS configuration
- File upload restrictions

## 🎨 UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Beautiful gradient backgrounds
- Card-based layouts
- Toast notifications
- Loading states
- Error boundaries
- Empty states
- Progress indicators
- Hover effects and transitions

## 📈 Performance Optimizations

- MongoDB indexes on frequently queried fields
- Pagination for large datasets
- Lazy loading of images
- Code splitting with Vite
- Nginx gzip compression
- Static asset caching
- Database connection pooling
- React component memoization

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 2: Cloud Platforms
- **AWS**: ECS, EC2, Lambda
- **Azure**: App Service, Container Instances
- **DigitalOcean**: App Platform, Droplets
- **Heroku**: Containers or buildpacks
- **Railway**: Full-stack deployment

### Option 3: Traditional Hosting
1. Deploy MongoDB (Atlas or self-hosted)
2. Deploy backend on Node.js server
3. Build and deploy frontend on static host

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

Created as a comprehensive MERN stack business incubator platform.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- OpenAI for AI-powered features
- Tailwind CSS for beautiful UI
- All open-source contributors

---

**Happy Coding! 🚀**

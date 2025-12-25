# Unified Deployment Guide

## Architecture Overview
✅ **Backend serves Frontend** - Single deployment on one port
- Backend: Node.js/Express (port 5000)
- Frontend: React build served as static files from backend
- Database: MongoDB Atlas

## Local Development
```bash
# Run both servers separately (different ports)
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

## Production Deployment on Render

### Option 1: Auto-Deploy (Recommended)
1. **Go to Render Dashboard** → Your service
2. **Manual Deploy** → **Deploy latest commit** (f75e9d4)
3. Wait for build to complete (~3-5 minutes)
4. Access your app at: `https://tasavur-lbcm.onrender.com`

### Option 2: New Service
1. **Delete old backend-only service** (if exists)
2. **Create New Web Service**
3. **Connect GitHub repo**: sharique0002/Tasavur
4. **Settings**:
   - Name: `tasavur-fullstack`
   - Build Command: `npm install && cd frontend_vite && npm install && npm run build && cd ../backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Environment Variables: (copy from render.yaml)

## What Changed

### Backend Changes
- ✅ Serves frontend static files from `/frontend_vite/dist`
- ✅ Catch-all route for SPA routing
- ✅ Updated CORS for same-origin requests

### Frontend Changes
- ✅ API URL changed to `/api` (relative path)
- ✅ No separate deployment needed

### Deployment Changes
- ✅ Single Render service (no Vercel needed)
- ✅ Unified build process
- ✅ Same port for frontend + backend

## URLs After Deployment
- **Production App**: https://tasavur-lbcm.onrender.com
- **API Endpoint**: https://tasavur-lbcm.onrender.com/api
- **Health Check**: https://tasavur-lbcm.onrender.com/health

## Benefits
✅ Simpler deployment (one service instead of two)
✅ No CORS issues (same origin)
✅ No environment variable management needed
✅ Lower cost (single service)
✅ Faster (no cross-origin requests)

## Troubleshooting
- **404 errors**: Ensure frontend build exists in `frontend_vite/dist`
- **API errors**: Check Render logs for backend issues
- **Build fails**: Ensure both frontend and backend dependencies install correctly

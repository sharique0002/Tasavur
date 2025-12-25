# Vercel Deployment Guide

## ✅ Architecture Configured for Vercel

### What's Set Up:
- **Frontend**: React/Vite (static build)
- **Backend**: Express API (Vercel serverless functions)
- **Database**: MongoDB Atlas (cloud)
- **Files**: Both frontend + backend deployed together

### File Structure:
```
/api/index.js          → Serverless function wrapper for Express
/backend/              → Express API code
/frontend_vite/dist/   → Built React app
/vercel.json          → Vercel configuration
```

## Deployment Steps

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Sign in with your GitHub account

### 2. Import Your Repository
1. Click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find **"Tasavur"** repository
4. Click **"Import"**

### 3. Configure Project Settings
**Framework Preset**: Other (leave as is)
**Root Directory**: `./` (keep default)
**Build Command**: Leave default or use: `npm run vercel-build`
**Output Directory**: `frontend_vite/dist`

### 4. Add Environment Variables
Click **"Environment Variables"** and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://Sharique:Sharique022@cluster0.ugjk9bj.mongodb.net/business-incubator?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_change_this_in_production
JWT_EXPIRE=15m
FRONTEND_URL=https://tasavur-lbcm.vercel.app
```

**Important**: 
- Add these to **Production**, **Preview**, and **Development** environments
- Update `FRONTEND_URL` after first deployment with your actual Vercel URL

### 5. Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Once done, you'll get your live URL!

## How It Works

### Request Flow:
1. User visits: `https://your-app.vercel.app`
2. API requests go to: `https://your-app.vercel.app/api/*`
3. Static files served from: `frontend_vite/dist`
4. Backend runs as serverless function in `/api/index.js`

### Routes Configuration (vercel.json):
```json
/api/* → api/index.js (serverless function)
/*     → frontend_vite/dist (static files)
```

## Testing After Deployment

### 1. Check Homepage
Visit: `https://your-app.vercel.app`
Should see: Login/Register page

### 2. Check API Health
Visit: `https://your-app.vercel.app/api/health`
Should see: `{"success": true, "message": "API is running"}`

### 3. Test Login
1. Go to your app
2. Try logging in with test credentials
3. Check browser console for errors

## Troubleshooting

### Build Fails
**Error**: Dependencies not found
**Fix**: Ensure both `backend/package.json` and `frontend_vite/package.json` exist

### API Returns 500
**Error**: Database connection failed
**Fix**: Check `MONGODB_URI` environment variable is correct

### CORS Errors
**Error**: Cross-origin blocked
**Fix**: Already configured - backend allows `*.vercel.app` domains

### Socket.IO Not Working
**Note**: Socket.IO may have limitations in serverless environment
- Real-time features might need adjustment
- Consider using Vercel's real-time solutions or keep polling

## Environment Variables Management

### To Update Variables:
1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Edit/Add variables
4. Redeploy for changes to take effect

## Auto-Deployment

✅ **Enabled by default**
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Instant rollback if needed

## Local Development

```bash
# Run both servers (different ports)
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

## Production URLs (After Deployment)

- **App**: https://tasavur-lbcm.vercel.app (or your assigned URL)
- **API**: https://tasavur-lbcm.vercel.app/api
- **Health**: https://tasavur-lbcm.vercel.app/api/health

## Benefits of Vercel Deployment

✅ Free tier available
✅ Automatic HTTPS
✅ Global CDN
✅ Auto-scaling
✅ Zero configuration needed
✅ GitHub integration
✅ Preview deployments
✅ Easy rollbacks

## Next Steps After First Deploy

1. ✅ Test all functionality
2. ✅ Update `FRONTEND_URL` env var with actual Vercel URL
3. ✅ Add custom domain (optional)
4. ✅ Monitor performance in Vercel dashboard
5. ✅ Delete old Render service (if exists)

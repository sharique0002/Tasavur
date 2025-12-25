# Vercel Deployment Guide for Tasavur

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Choose One Option)

Since Vercel is optimized for frontend, deploy your backend separately:

#### Option A: Deploy Backend to Render.com (Recommended)

**Method 1: Using render.yaml (Automatic)**
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `https://github.com/sharique0002/Tasavur`
4. Render will detect `render.yaml` and configure automatically
5. Click "Apply" to deploy
6. Copy your backend URL (e.g., `https://tasavur-backend.onrender.com`)

**Method 2: Manual Setup**
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: tasavur-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=mongodb+srv://Sharique:Sharique022@cluster0.ugjk9bj.mongodb.net/business-incubator?retryWrites=true&w=majority&appName=Cluster0
     JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
     JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_change_this_in_production
     JWT_EXPIRE=15m
     FRONTEND_URL=https://your-app.vercel.app
     ```
5. Click "Create Web Service"
6. Copy your backend URL (e.g., `https://tasavur-backend.onrender.com`)

#### Option B: Deploy Backend to Railway.app
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables (same as above)
5. Railway will auto-detect Node.js and deploy
6. Copy your backend URL

### Step 2: Deploy Frontend to Vercel

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign up with GitHub
   - Click "Add New" → "Project"
   - Import your repository: `https://github.com/sharique0002/Tasavur`
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend_vite`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Add Environment Variable**:
   - In Vercel project settings → "Environment Variables"
   - Add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://your-backend-url.onrender.com/api`
     - (Replace with your actual backend URL from Step 1)

4. **Deploy**: Click "Deploy"

### Step 3: Update CORS in Backend

After deployment, update your backend's allowed origins:

1. Edit `backend/server.js` CORS configuration:
   ```javascript
   cors({
     origin: [
       'http://localhost:5173',
       'https://your-app.vercel.app'  // Add your Vercel domain
     ],
     credentials: true
   })
   ```

2. Commit and push changes
3. Backend will auto-redeploy

### Step 4: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test login with: `admin@tasavur.com` / `Admin@123`
3. Check if API calls work (check browser console)

## 📋 Environment Variables Checklist

### Backend (Render/Railway)
- ✅ NODE_ENV=production
- ✅ PORT=5000
- ✅ MONGODB_URI (Atlas connection string)
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ JWT_EXPIRE
- ✅ FRONTEND_URL (Vercel URL)

### Frontend (Vercel)
- ✅ VITE_API_URL (Backend URL + /api)

## 🔧 Troubleshooting

### Issue: API calls fail with CORS error
**Solution**: Make sure FRONTEND_URL in backend matches your Vercel domain

### Issue: "API not responding"
**Solution**: Check if backend is running on Render/Railway. View logs.

### Issue: Database connection fails
**Solution**: Verify MONGODB_URI in backend environment variables

## 📞 Quick Deploy Commands

```bash
# 1. Commit changes
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Deploy backend (if using Render CLI)
render deploy

# 3. Vercel will auto-deploy on push (if connected to GitHub)
```

## 🌐 Your Deployed URLs

After deployment, update these:
- **Frontend**: https://tasavur.vercel.app
- **Backend**: https://tasavur-backend.onrender.com
- **Database**: MongoDB Atlas (cluster0.ugjk9bj.mongodb.net)

## 🎉 You're Done!

Your application is now live and accessible worldwide!

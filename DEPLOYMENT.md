# Tasavur Backend Deployment Guide

## Deploy to Render (Free Tier)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `sharique0002/Tasavur`
4. Configure:
   - **Name**: tasavur-backend
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = Your MongoDB connection string (get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
   - `JWT_SECRET` = Any random string (generate one)
   - `JWT_REFRESH_SECRET` = Another random string
   - `FRONTEND_URL` = `https://tasavur.vercel.app`

6. Click "Create Web Service"

7. Once deployed, copy your backend URL (e.g., `https://tasavur-backend.onrender.com`)

## Update Frontend

After backend deployment, update Vercel environment variable:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://tasavur-backend.onrender.com/api`
3. Redeploy the frontend

## MongoDB Atlas Setup (if needed)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string and add to Render env vars

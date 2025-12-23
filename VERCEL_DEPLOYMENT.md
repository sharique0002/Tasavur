# Vercel Deployment Guide

## Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to [Vercel](https://vercel.com)** and sign in

3. **Import your repository:**
   - Click "Add New Project"
   - Select your repository
   - **Important:** Set the Root Directory to `frontend_vite`

4. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com/api`
   
   > Replace with your actual backend URL (e.g., from Render, Railway, etc.)

6. **Deploy!**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd frontend_vite

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

## Backend Deployment Options

Your Express.js backend needs to be deployed separately. Recommended options:

### Option A: Render (Recommended - Free tier available)

1. Go to [Render](https://render.com)
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Set Root Directory to `backend`
5. Set Build Command: `npm install`
6. Set Start Command: `npm start`
7. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `NODE_ENV` - `production`
   - Other secrets as needed

### Option B: Railway

1. Go to [Railway](https://railway.app)
2. Connect your GitHub repository
3. Configure with `backend` as root directory
4. Add environment variables

### Option C: Vercel Serverless Functions

If you want everything on Vercel, you'd need to convert your Express routes to serverless functions. This requires significant refactoring.

---

## Environment Variables Checklist

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., `https://your-backend.onrender.com/api`) |

### Backend (Render/Railway)
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `NODE_ENV` | Set to `production` |
| `CORS_ORIGIN` | Your Vercel frontend URL |
| `AWS_ACCESS_KEY_ID` | AWS credentials (if using S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials (if using S3) |
| `AWS_S3_BUCKET` | S3 bucket name |

---

## Post-Deployment

1. **Update CORS settings** in your backend to allow your Vercel domain:
   ```javascript
   // backend/server.js
   const corsOptions = {
     origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
     credentials: true,
   };
   ```

2. **Update frontend environment variable** in Vercel dashboard with your actual backend URL

3. **Test all API endpoints** after deployment

---

## Troubleshooting

- **API calls failing?** Check CORS settings and environment variables
- **Build failing?** Check Node.js version compatibility
- **Routing issues?** The `vercel.json` file handles SPA routing

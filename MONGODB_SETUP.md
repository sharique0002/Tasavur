# MongoDB Connection Setup

Your MongoDB connection string:
```
mongodb+srv://mdsharique23_db_user:<db_password>@databasetest.p1t2jwc.mongodb.net/?appName=DataBaseTest
```

## Important: Replace `<db_password>` with your actual password!

Example:
```
mongodb+srv://mdsharique23_db_user:MyPassword123@databasetest.p1t2jwc.mongodb.net/?appName=DataBaseTest
```

## For Render Deployment:

When setting up on Render, add this environment variable:
- **Key**: `MONGODB_URI`
- **Value**: `mongodb+srv://mdsharique23_db_user:YOUR_ACTUAL_PASSWORD@databasetest.p1t2jwc.mongodb.net/?appName=DataBaseTest`

## For Local Testing:

Create a `.env` file in the `backend` folder:
```env
MONGODB_URI=mongodb+srv://mdsharique23_db_user:YOUR_ACTUAL_PASSWORD@databasetest.p1t2jwc.mongodb.net/?appName=DataBaseTest
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
FRONTEND_URL=http://localhost:5173
PORT=5000
```

## Next Steps:
1. Replace `<db_password>` with your actual MongoDB password
2. Add to Render environment variables
3. Deploy your backend

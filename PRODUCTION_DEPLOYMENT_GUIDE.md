# MindNotes Production Deployment Guide

## Overview
This guide will help you deploy your MindNotes application to production with:
- **Frontend**: Netlify (Static hosting)
- **Backend**: Railway/Render/Heroku (API server)
- **Database**: PostgreSQL (Production database)
- **Cache**: Redis (Rate limiting and caching)

## Step 1: Backend Deployment

### Option A: Railway (Recommended - Easy and affordable)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select your repository

3. **Configure Service**
   - Railway will auto-detect your FastAPI app
   - Set the following environment variables in Railway dashboard:
   ```
   MONGO_URL=postgresql://username:password@host:port/database
   REDIS_URL=redis://username:password@host:port
   JWT_SECRET_KEY=your-super-secret-jwt-key-here
   PORT=8000
   ```

4. **Add PostgreSQL and Redis**
   - In Railway dashboard, click "Add Service"
   - Add "PostgreSQL" service
   - Add "Redis" service
   - Railway will provide connection URLs automatically

### Option B: Render (Alternative)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Add Database Services**
   - Create PostgreSQL service
   - Create Redis service
   - Configure environment variables

### Option C: Heroku (Traditional)

1. **Create Heroku Account**
   - Go to https://heroku.com
   - Install Heroku CLI

2. **Create Application**
   ```bash
   heroku create your-mindnotes-api
   heroku addons:create heroku-postgresql:mini
   heroku addons:create heroku-redis:mini
   ```

## Step 2: Database Setup

### PostgreSQL Configuration
Your backend already has PostgreSQL support. The database will be automatically created when you deploy.

### Redis Configuration
Redis is used for rate limiting. If Redis is unavailable, the system falls back to PostgreSQL.

## Step 3: Frontend Deployment to Netlify

### A. Prepare Frontend Build

1. **Update Environment Variables**
   - Update `/app/frontend/.env` with your production backend URL
   ```
   REACT_APP_BACKEND_URL=https://your-backend-service.railway.app
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   yarn build
   ```

### B. Deploy to Netlify

1. **Method 1: Drag & Drop (Quick)**
   - Go to https://app.netlify.com
   - Drag the `frontend/build` folder to the deploy area
   - Your site will be deployed with a random URL

2. **Method 2: Git Integration (Recommended)**
   - Push your code to GitHub
   - In Netlify dashboard, click "New site from Git"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `yarn build`
     - Publish directory: `frontend/build`
     - Base directory: `frontend`

### C. Configure Netlify

1. **Environment Variables**
   - In Netlify dashboard, go to Site settings → Environment variables
   - Add: `REACT_APP_BACKEND_URL=https://your-backend-service.railway.app`

2. **Build Settings**
   - Node version: 18
   - Package manager: Yarn

## Step 4: Backend Configuration for Production

### Update CORS Settings
Your backend needs to allow requests from your Netlify domain:

1. **Update server.py**
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://your-netlify-site.netlify.app",
           "http://localhost:3000",  # For development
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Environment Variables for Backend

Set these in your backend service (Railway/Render/Heroku):

```bash
# Database
POSTGRES_URL=postgresql://username:password@host:port/database

# Redis (optional - fallback to PostgreSQL if not available)
REDIS_URL=redis://username:password@host:port

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-generate-a-strong-one

# API Settings
PORT=8000
HOST=0.0.0.0
```

## Step 5: Testing Deployment

### Backend Health Check
1. Visit `https://your-backend-url.railway.app/` 
2. Should return: "MindNotes API is running"
3. Check `/docs` for API documentation

### Frontend Testing
1. Visit your Netlify site
2. Test registration and login
3. Verify all features work with production backend

## Step 6: Custom Domain (Future)

### For Backend (Railway)
1. Go to Railway dashboard
2. Settings → Domains
3. Add your custom domain
4. Configure DNS records

### For Frontend (Netlify)
1. Go to Netlify dashboard
2. Domain settings → Add custom domain
3. Configure DNS records

## Security Checklist

- [ ] Strong JWT secret key
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] HTTPS enforced
- [ ] Rate limiting enabled

## Common Issues and Solutions

### 1. CORS Errors
- Update backend CORS settings with your Netlify domain
- Ensure HTTPS is used everywhere in production

### 2. Database Connection Issues
- Verify PostgreSQL URL format
- Check firewall settings
- Ensure database service is running

### 3. Build Failures
- Check Node.js version compatibility
- Verify yarn.lock file
- Check build logs for specific errors

### 4. Environment Variables
- Ensure all required variables are set
- Double-check variable names (case-sensitive)
- Restart services after changing variables

## Monitoring and Maintenance

### Backend Monitoring
- Check backend logs regularly
- Monitor database performance
- Set up alerts for downtime

### Frontend Monitoring
- Monitor Netlify deploy logs
- Check for JavaScript errors
- Monitor Core Web Vitals

## Cost Estimates (Monthly)

### Railway
- Hobby plan: $5/month
- PostgreSQL: $5/month
- Redis: $5/month
- **Total: ~$15/month**

### Render
- Web service: $7/month
- PostgreSQL: $7/month
- Redis: $7/month
- **Total: ~$21/month**

### Netlify
- Hobby plan: Free (100GB bandwidth)
- Pro plan: $19/month (if needed)

## Next Steps

1. Choose backend service (Railway recommended)
2. Deploy backend with database
3. Update frontend environment variables
4. Deploy frontend to Netlify
5. Test full application
6. Configure custom domain (when ready)

Would you like me to help you with any specific step in this process?
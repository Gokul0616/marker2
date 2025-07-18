# Backend Deployment Guide

## Option 1: Railway (Recommended)

### Why Railway?
- Easy PostgreSQL and Redis setup
- Automatic deployments from GitHub
- Built-in monitoring and logs
- Affordable pricing ($5/month per service)
- Great for startups and small projects

### Step-by-Step Railway Deployment

1. **Create Railway Account**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub
   - Verify your email

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repositories
   - Select your MindNotes repository

3. **Configure the Web Service**
   - Railway will auto-detect your FastAPI app
   - It will use the `railway.toml` configuration
   - The start command will be: `cd backend && python -m uvicorn server:app --host 0.0.0.0 --port $PORT`

4. **Add PostgreSQL Database**
   - In your Railway project dashboard
   - Click "New Service"
   - Select "PostgreSQL"
   - Railway will create a database and provide connection details

5. **Add Redis Service**
   - Click "New Service" again
   - Select "Redis"
   - Railway will create Redis instance and provide connection details

6. **Set Environment Variables**
   - Go to your web service
   - Click "Variables" tab
   - Add these variables:

   ```bash
   # Database (Railway will provide these automatically)
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Redis (Railway will provide these automatically)
   REDIS_URL=redis://username:password@host:port
   
   # JWT Secret (generate a strong secret)
   JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
   
   # CORS Configuration (replace with your Netlify domain)
   ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
   
   # Application Settings
   ENVIRONMENT=production
   DEBUG=false
   ```

7. **Deploy**
   - Railway will automatically deploy when you push to GitHub
   - Check the deployment logs
   - Your API will be available at: `https://your-service-name.railway.app`

8. **Verify Deployment**
   - Visit `https://your-service-name.railway.app/api/`
   - Should return: "MindNotes API is running"
   - Check `/api/docs` for API documentation

## Option 2: Render

### Step-by-Step Render Deployment

1. **Create Render Account**
   - Go to [Render](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure service:
     - **Name**: mindnotes-api
     - **Environment**: Python 3
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `cd backend && gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

3. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Choose free plan
   - Note the connection details

4. **Add Redis Service**
   - Click "New" → "Redis"
   - Choose free plan
   - Note the connection details

5. **Environment Variables**
   - In your web service settings
   - Add environment variables similar to Railway

## Option 3: Heroku

### Step-by-Step Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # On macOS
   brew install heroku/brew/heroku
   
   # On Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   heroku create mindnotes-api
   ```

3. **Add Add-ons**
   ```bash
   # PostgreSQL
   heroku addons:create heroku-postgresql:mini
   
   # Redis
   heroku addons:create heroku-redis:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET_KEY=your-super-secret-jwt-key
   heroku config:set ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
   heroku config:set ENVIRONMENT=production
   heroku config:set DEBUG=false
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

## Database Setup

### PostgreSQL Tables
Your backend will automatically create these tables:
- `users` - User accounts
- `mfa_backup_codes` - Multi-factor authentication codes
- `login_attempts` - Rate limiting data
- `workspaces` - User workspaces
- `pages` - Workspace pages
- `databases` - User databases
- `workspace_members` - Workspace membership
- `page_permissions` - Page access control
- `database_rows` - Database content

### Redis Usage
Redis is used for:
- Rate limiting (login attempts)
- Session management
- Caching (if enabled)

If Redis is unavailable, the system falls back to PostgreSQL.

## Security Configuration

### CORS Settings
Update your backend's CORS configuration:

```python
# In backend/server.py
allowed_origins = [
    "http://localhost:3000",  # Development
    "https://your-netlify-site.netlify.app",  # Production
    "https://your-custom-domain.com",  # Custom domain
]
```

### JWT Secret
Generate a strong JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Monitoring and Maintenance

### Health Checks
- `/api/health` - Basic health check
- `/api/` - API status
- `/api/docs` - API documentation

### Logs
- Check service logs regularly
- Monitor for errors and performance issues
- Set up alerts for downtime

### Database Maintenance
- Regular backups (most services do this automatically)
- Monitor database size and performance
- Clean up old data if needed

## Cost Breakdown

### Railway (Recommended)
- Web service: $5/month
- PostgreSQL: $5/month
- Redis: $5/month
- **Total: $15/month**

### Render
- Web service: $7/month
- PostgreSQL: $7/month
- Redis: $7/month
- **Total: $21/month**

### Heroku
- Web dyno: $7/month
- PostgreSQL: $9/month
- Redis: $15/month
- **Total: $31/month**

## Performance Tips

1. **Use Connection Pooling**: Already configured in your backend
2. **Enable Caching**: Redis is set up for caching
3. **Monitor Database Queries**: Use logging to identify slow queries
4. **Scale Horizontally**: Add more web service instances if needed
5. **Use CDN**: For static assets (handled by Netlify for frontend)

## Backup Strategy

1. **Database Backups**: Most services provide automatic backups
2. **Code Backups**: Keep code in GitHub
3. **Environment Variables**: Document all environment variables
4. **Regular Testing**: Test your deployed application regularly

## Troubleshooting Common Issues

### 1. Service Won't Start
- Check logs for errors
- Verify all environment variables are set
- Ensure database connection is working

### 2. Database Connection Issues
- Check PostgreSQL URL format
- Verify database service is running
- Check firewall settings

### 3. CORS Errors
- Add your frontend domain to CORS settings
- Ensure HTTPS is used in production
- Check for typos in domain names

### 4. Rate Limiting Issues
- Verify Redis connection
- Check database fallback is working
- Monitor login attempt logs

## Next Steps After Deployment

1. **Test All Features**: Registration, login, MFA, workspaces, pages
2. **Monitor Performance**: Check response times and error rates
3. **Set Up Alerts**: For downtime and errors
4. **Update Documentation**: With your production URLs
5. **Plan Scaling**: Monitor usage and plan for growth

## Support

- Railway: [Documentation](https://docs.railway.app)
- Render: [Documentation](https://render.com/docs)
- Heroku: [Documentation](https://devcenter.heroku.com)

Choose the service that best fits your needs and budget. Railway is recommended for its simplicity and cost-effectiveness.
# Netlify Build Configuration
# This file configures the build process for Netlify deployment

# Build settings
# The build command will run 'yarn build' from the frontend directory
# The publish directory will be 'frontend/build'

# Environment Variables Required for Netlify:
# REACT_APP_BACKEND_URL - Set this to your backend API URL in Netlify dashboard

# Notes:
# - The backend needs to be hosted separately (not on Netlify)
# - Consider using services like Railway, Render, or Heroku for the backend
# - Update REACT_APP_BACKEND_URL in Netlify environment variables
# - Make sure CORS is properly configured in the backend for your domain

# For production backend setup:
# 1. Deploy backend to a service like Railway/Render/Heroku
# 2. Set up PostgreSQL database (can use services like ElephantSQL, Supabase, etc.)
# 3. Configure Redis for rate limiting (RedisLabs, Upstash, etc.)
# 4. Update environment variables in production backend
# 5. Set REACT_APP_BACKEND_URL in Netlify to your backend URL
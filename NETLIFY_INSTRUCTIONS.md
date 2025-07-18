# Netlify Deployment Instructions

## Quick Deploy Steps

### 1. GitHub Setup
```bash
# If your code isn't on GitHub yet:
git init
git add .
git commit -m "Initial commit - MindNotes production ready"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2. Deploy to Netlify

#### Option A: Git Integration (Recommended)
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your repository
5. Build settings will auto-populate from `netlify.toml`
6. Click "Deploy site"

#### Option B: Manual Deploy
1. Run `yarn build` in the frontend directory
2. Drag `frontend/build` folder to Netlify deploy area
3. Site will be deployed instantly

### 3. Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
```
REACT_APP_BACKEND_URL=https://your-backend-service.railway.app
NODE_ENV=production
```

### 4. Domain Settings
- Your site will get a random URL like `https://amazing-site-123.netlify.app`
- You can change the subdomain in Site Settings → Domain Management
- For custom domains, add them in Domain Management section

### 5. Build & Deploy Settings
These are automatically configured via `netlify.toml`:
- **Build command**: `yarn install && yarn build`
- **Publish directory**: `frontend/build/`
- **Base directory**: `frontend/`

### 6. Post-Deployment
1. Test your site URL
2. Verify all features work
3. Update CORS settings in backend with your new domain
4. Test registration, login, and all features

## Troubleshooting

### Build Fails
- Check build logs in Netlify
- Verify all dependencies are in package.json
- Ensure Node.js version compatibility

### CORS Errors
- Update backend CORS settings
- Add your Netlify domain to allowed origins
- Restart backend service

### Environment Variables Not Working
- Check variable names (case-sensitive)
- Restart deployment after adding variables
- Verify REACT_APP_ prefix for client-side variables

## Security Notes

- All environment variables starting with `REACT_APP_` are exposed to the client
- Never put sensitive data in client-side environment variables
- Backend secrets should only be in backend environment variables

## Performance Optimization

- Static assets are automatically cached for 1 year
- Gzip compression is enabled by default
- CDN distribution is automatic
- Images are optimized automatically

## Custom Domain Setup (Future)

1. Purchase domain from registrar
2. Add custom domain in Netlify
3. Update DNS records as instructed
4. SSL certificate will be auto-generated
5. Update CORS settings in backend
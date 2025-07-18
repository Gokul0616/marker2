#!/bin/bash

# Deploy script for production

echo "🚀 Starting MindNotes Production Deployment..."

# 1. Build frontend
echo "📦 Building frontend..."
cd frontend
yarn install
yarn build

# 2. Prepare backend
echo "🔧 Preparing backend..."
cd ../backend
pip install -r requirements.txt

# 3. Run tests
echo "🧪 Running tests..."
cd ..
python backend_test.py

# 4. Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deploy
cp -r frontend/build deploy/
cp -r backend deploy/
cp Procfile deploy/
cp runtime.txt deploy/
cp railway.toml deploy/
cp main.py deploy/

echo "✅ Deployment package ready in ./deploy/"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub"
echo "2. Deploy backend to Railway/Render/Heroku"
echo "3. Deploy frontend to Netlify"
echo "4. Update environment variables"
echo ""
echo "See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions."
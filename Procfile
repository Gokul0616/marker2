# Production Backend Configuration

# Render
web: cd backend && gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

# Alternative for Railway
# web: cd backend && python -m uvicorn server:app --host 0.0.0.0 --port $PORT

# Alternative for Heroku
# web: cd backend && gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
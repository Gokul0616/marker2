from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, HTTPException, status
import redis
import os
from database import record_login_attempt, get_recent_login_attempts

# Redis configuration for rate limiting
REDIS_URL = os.environ.get('RATE_LIMIT_REDIS_URL', 'redis://localhost:6379')

try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

# Rate limiting configurations
MAX_LOGIN_ATTEMPTS = 3
LOCKOUT_DURATION_MINUTES = 30

class RateLimiter:
    def __init__(self, max_attempts: int = MAX_LOGIN_ATTEMPTS, lockout_duration: int = LOCKOUT_DURATION_MINUTES):
        self.max_attempts = max_attempts
        self.lockout_duration = lockout_duration
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        x_forwarded_for = request.headers.get('X-Forwarded-For')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.client.host
    
    def get_redis_key(self, ip: str) -> str:
        """Get Redis key for IP"""
        return f"login_attempts:{ip}"
    
    def check_rate_limit(self, request: Request) -> bool:
        """Check if IP is rate limited"""
        ip = self.get_client_ip(request)
        
        try:
            if redis_client:
                # Use Redis for rate limiting
                key = self.get_redis_key(ip)
                attempts = redis_client.get(key)
                
                if attempts and int(attempts) >= self.max_attempts:
                    return False
                
                return True
        except Exception:
            # Redis failed, fall back to database
            pass
        
        # Fallback to database
        recent_attempts = get_recent_login_attempts(ip, self.lockout_duration)
        failed_attempts = [attempt for attempt in recent_attempts if not attempt['successful']]
        
        return len(failed_attempts) < self.max_attempts
    
    def record_attempt(self, request: Request, success: bool, user_email: Optional[str] = None):
        """Record a login attempt"""
        ip = self.get_client_ip(request)
        
        # Record in database
        record_login_attempt(ip, user_email, success)
        
        # Update Redis counter
        try:
            if redis_client:
                key = self.get_redis_key(ip)
                
                if success:
                    # Reset counter on successful login
                    redis_client.delete(key)
                else:
                    # Increment counter on failed login
                    current = redis_client.get(key) or 0
                    redis_client.setex(key, self.lockout_duration * 60, int(current) + 1)
        except Exception:
            # Redis failed, database fallback is already handled above
            pass
    
    def reset_attempts(self, request: Request):
        """Reset login attempts for IP"""
        ip = self.get_client_ip(request)
        
        try:
            if redis_client:
                key = self.get_redis_key(ip)
                redis_client.delete(key)
        except Exception:
            # Redis failed, database cleanup would happen naturally with time-based queries
            pass
    
    def get_remaining_attempts(self, request: Request) -> int:
        """Get remaining attempts for IP"""
        ip = self.get_client_ip(request)
        
        try:
            if redis_client:
                key = self.get_redis_key(ip)
                attempts = redis_client.get(key)
                return self.max_attempts - int(attempts or 0)
        except Exception:
            # Redis failed, fall back to database
            pass
        
        # Fallback to database
        recent_attempts = get_recent_login_attempts(ip, self.lockout_duration)
        failed_attempts = [attempt for attempt in recent_attempts if not attempt['successful']]
        
        return self.max_attempts - len(failed_attempts)

# Global rate limiter instance
rate_limiter = RateLimiter()

def check_rate_limit_middleware(request: Request):
    """Middleware to check rate limiting"""
    if not rate_limiter.check_rate_limit(request):
        remaining_attempts = rate_limiter.get_remaining_attempts(request)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please try again in {LOCKOUT_DURATION_MINUTES} minutes.",
            headers={"X-RateLimit-Remaining": str(remaining_attempts)}
        )
    return True
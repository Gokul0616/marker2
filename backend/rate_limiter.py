from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
import redis
import os
from database import get_db, LoginAttempt

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
        db = next(get_db())
        cutoff_time = datetime.utcnow() - timedelta(minutes=self.lockout_duration)
        
        recent_attempts = db.query(LoginAttempt).filter(
            LoginAttempt.ip_address == ip,
            LoginAttempt.attempted_at >= cutoff_time,
            LoginAttempt.success == False
        ).count()
        
        return recent_attempts < self.max_attempts
    
    def record_attempt(self, request: Request, success: bool, user_id: Optional[str] = None):
        """Record a login attempt"""
        ip = self.get_client_ip(request)
        user_agent = request.headers.get('User-Agent', '')
        
        # Record in database
        db = next(get_db())
        attempt = LoginAttempt(
            user_id=user_id,
            ip_address=ip,
            user_agent=user_agent,
            success=success
        )
        db.add(attempt)
        db.commit()
        
        # Update Redis counter
        if redis_client:
            key = self.get_redis_key(ip)
            
            if success:
                # Reset counter on successful login
                redis_client.delete(key)
            else:
                # Increment counter on failed login
                current = redis_client.get(key) or 0
                redis_client.setex(key, self.lockout_duration * 60, int(current) + 1)
    
    def reset_attempts(self, request: Request):
        """Reset login attempts for IP"""
        ip = self.get_client_ip(request)
        
        if redis_client:
            key = self.get_redis_key(ip)
            redis_client.delete(key)
    
    def get_remaining_attempts(self, request: Request) -> int:
        """Get remaining attempts for IP"""
        ip = self.get_client_ip(request)
        
        if redis_client:
            key = self.get_redis_key(ip)
            attempts = redis_client.get(key)
            return self.max_attempts - int(attempts or 0)
        else:
            db = next(get_db())
            cutoff_time = datetime.utcnow() - timedelta(minutes=self.lockout_duration)
            
            recent_attempts = db.query(LoginAttempt).filter(
                LoginAttempt.ip_address == ip,
                LoginAttempt.attempted_at >= cutoff_time,
                LoginAttempt.success == False
            ).count()
            
            return self.max_attempts - recent_attempts

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
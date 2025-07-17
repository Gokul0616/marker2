from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from datetime import timedelta
from typing import Optional
import uuid

from database import (
    get_user_by_email, get_user_by_id, create_user, update_user,
    record_login_attempt, get_recent_login_attempts
)
from auth import (
    UserCreate, UserLogin, UserResponse, Token, MFASetupResponse, MFAVerifyRequest,
    get_password_hash, authenticate_user, create_access_token, get_current_active_user,
    enable_mfa_for_user, disable_mfa_for_user, verify_backup_code_for_user
)
from rate_limiter import rate_limiter, check_rate_limit_middleware

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        'name': user_data.name,
        'email': user_data.email,
        'hashed_password': hashed_password,
        'is_active': True,
        'is_verified': True  # For demo purposes
    }
    
    db_user = create_user(user_doc)
    
    return UserResponse.from_orm(db_user)

@router.post("/login", response_model=Token)
async def login(request: Request, user_data: UserLogin):
    """Login user and return access token"""
    
    # Get client IP
    client_ip = request.client.host
    
    # Check rate limiting
    recent_attempts = get_recent_login_attempts(client_ip, 30)
    failed_attempts = [attempt for attempt in recent_attempts if not attempt['successful']]
    
    if len(failed_attempts) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later."
        )
    
    # Authenticate user
    user = authenticate_user(user_data.email, user_data.password)
    
    if not user:
        # Record failed attempt
        record_login_attempt(client_ip, user_data.email, successful=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Record successful attempt
    record_login_attempt(client_ip, user_data.email, successful=True)
    
    # Create access token
    access_token = create_access_token(data={"sub": user['id']})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(current_user: dict = Depends(get_current_active_user)):
    """Setup MFA for current user"""
    if current_user.get('mfa_enabled'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    
    backup_codes = enable_mfa_for_user(current_user['id'])
    
    return MFASetupResponse(backup_codes=backup_codes)

@router.post("/mfa/verify")
async def verify_mfa(
    mfa_data: MFAVerifyRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Verify MFA backup code"""
    if not current_user.get('mfa_enabled'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    is_valid = verify_backup_code_for_user(current_user['id'], mfa_data.backup_code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid backup code"
        )
    
    return {"message": "MFA verified successfully"}

@router.post("/mfa/disable")
async def disable_mfa(current_user: dict = Depends(get_current_active_user)):
    """Disable MFA for current user"""
    if not current_user.get('mfa_enabled'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    disable_mfa_for_user(current_user['id'])
    
    return {"message": "MFA disabled successfully"}

@router.get("/rate-limit-status")
async def get_rate_limit_status(request: Request):
    """Get current rate limit status"""
    client_ip = request.client.host
    recent_attempts = get_recent_login_attempts(client_ip, 30)
    failed_attempts = [attempt for attempt in recent_attempts if not attempt['successful']]
    
    remaining_attempts = max(0, 3 - len(failed_attempts))
    
    return {
        "remaining_attempts": remaining_attempts,
        "is_blocked": len(failed_attempts) >= 3
    }
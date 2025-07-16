from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
import uuid

from ..database import get_db, User, create_tables
from ..auth import (
    UserCreate, UserLogin, UserResponse, Token, MFASetupResponse, MFAVerifyRequest,
    get_password_hash, authenticate_user, create_access_token, get_current_active_user,
    enable_mfa_for_user, disable_mfa_for_user, verify_backup_code
)
from ..rate_limiter import rate_limiter, check_rate_limit_middleware

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Create tables if they don't exist
    create_tables()
    
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        id=uuid.uuid4(),
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True  # For demo purposes
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.from_orm(db_user)

@router.post("/login", response_model=Token)
async def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    # Check rate limiting
    check_rate_limit_middleware(request)
    
    # Authenticate user
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        # Record failed attempt
        rate_limiter.record_attempt(request, False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        rate_limiter.record_attempt(request, False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # If MFA is enabled, require backup code verification
    if user.mfa_enabled:
        # Record successful password verification but don't complete login yet
        rate_limiter.record_attempt(request, True, str(user.id))
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="MFA verification required",
            headers={"X-MFA-Required": "true", "X-User-ID": str(user.id)}
        )
    
    # Create access token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Record successful attempt
    rate_limiter.record_attempt(request, True, str(user.id))
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.post("/verify-mfa", response_model=Token)
async def verify_mfa(request: Request, mfa_data: MFAVerifyRequest, user_id: str, db: Session = Depends(get_db)):
    """Verify MFA backup code"""
    # Check rate limiting
    check_rate_limit_middleware(request)
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        rate_limiter.record_attempt(request, False)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify backup code
    if not verify_backup_code(db, user_id, mfa_data.backup_code):
        rate_limiter.record_attempt(request, False, user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid backup code"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Record successful attempt
    rate_limiter.record_attempt(request, True, user_id)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.post("/enable-mfa", response_model=MFASetupResponse)
async def enable_mfa(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Enable MFA for current user"""
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    
    backup_codes = enable_mfa_for_user(db, str(current_user.id))
    
    return MFASetupResponse(backup_codes=backup_codes)

@router.post("/disable-mfa")
async def disable_mfa(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Disable MFA for current user"""
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    disable_mfa_for_user(db, str(current_user.id))
    
    return {"message": "MFA disabled successfully"}

@router.post("/regenerate-backup-codes", response_model=MFASetupResponse)
async def regenerate_backup_codes(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Regenerate backup codes for current user"""
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    backup_codes = enable_mfa_for_user(db, str(current_user.id))
    
    return MFASetupResponse(backup_codes=backup_codes)

@router.get("/rate-limit-status")
async def get_rate_limit_status(request: Request):
    """Get current rate limit status"""
    remaining = rate_limiter.get_remaining_attempts(request)
    return {
        "remaining_attempts": remaining,
        "max_attempts": rate_limiter.max_attempts,
        "lockout_duration_minutes": rate_limiter.lockout_duration
    }
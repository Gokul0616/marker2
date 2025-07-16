from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import secrets
import string
import os
from .database import get_db, User, MFABackupCode

# Security configurations
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', '24'))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    color: str
    is_active: bool
    mfa_enabled: bool
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    user_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class MFASetupResponse(BaseModel):
    backup_codes: list[str]

class MFAVerifyRequest(BaseModel):
    backup_code: str

# Password hashing
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(user_id=user_id)
        return token_data
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Authentication functions
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    token_data = verify_token(token)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# MFA functions
def generate_backup_codes(count: int = 8) -> list[str]:
    """Generate backup codes for MFA"""
    codes = []
    for _ in range(count):
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        codes.append(code)
    return codes

def create_user_backup_codes(db: Session, user_id: str) -> list[str]:
    """Create backup codes for a user"""
    # Delete existing codes
    db.query(MFABackupCode).filter(MFABackupCode.user_id == user_id).delete()
    
    # Generate new codes
    codes = generate_backup_codes()
    
    # Save to database
    for code in codes:
        backup_code = MFABackupCode(
            user_id=user_id,
            code=code
        )
        db.add(backup_code)
    
    db.commit()
    return codes

def verify_backup_code(db: Session, user_id: str, code: str) -> bool:
    """Verify a backup code"""
    backup_code = db.query(MFABackupCode).filter(
        MFABackupCode.user_id == user_id,
        MFABackupCode.code == code,
        MFABackupCode.used == False
    ).first()
    
    if not backup_code:
        return False
    
    # Mark as used
    backup_code.used = True
    backup_code.used_at = datetime.utcnow()
    db.commit()
    
    return True

def enable_mfa_for_user(db: Session, user_id: str) -> list[str]:
    """Enable MFA for a user and return backup codes"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate backup codes
    codes = create_user_backup_codes(db, user_id)
    
    # Enable MFA
    user.mfa_enabled = True
    db.commit()
    
    return codes

def disable_mfa_for_user(db: Session, user_id: str):
    """Disable MFA for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete backup codes
    db.query(MFABackupCode).filter(MFABackupCode.user_id == user_id).delete()
    
    # Disable MFA
    user.mfa_enabled = False
    db.commit()
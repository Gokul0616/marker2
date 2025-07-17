from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import secrets
import string
import os
from database import (
    get_user_by_email, get_user_by_id, create_user, update_user,
    create_backup_codes, verify_backup_code, get_user_backup_codes
)

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
    
    @classmethod
    def from_orm(cls, obj):
        # Handle both dict and object input
        if isinstance(obj, dict):
            data = {
                'id': str(obj.get('id')),
                'name': obj.get('name'),
                'email': obj.get('email'),
                'avatar': obj.get('avatar'),
                'color': obj.get('color', '#3b82f6'),
                'is_active': obj.get('is_active', True),
                'mfa_enabled': obj.get('mfa_enabled', False)
            }
        else:
            data = {
                'id': str(obj.id),
                'name': obj.name,
                'email': obj.email,
                'avatar': obj.avatar,
                'color': obj.color,
                'is_active': obj.is_active,
                'mfa_enabled': obj.mfa_enabled
            }
        return cls(**data)

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
def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user['hashed_password']):
        return False
    return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_data = verify_token(token)
    user = get_user_by_id(token_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get('is_active', True):
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

def create_user_backup_codes(user_id: str) -> list[str]:
    """Create backup codes for a user"""
    # Generate new codes
    codes = generate_backup_codes()
    
    # Save to database
    create_backup_codes(user_id, codes)
    
    return codes

def verify_backup_code_for_user(user_id: str, code: str) -> bool:
    """Verify a backup code"""
    return verify_backup_code(user_id, code)

def enable_mfa_for_user(user_id: str) -> list[str]:
    """Enable MFA for a user and return backup codes"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate backup codes
    codes = create_user_backup_codes(user_id)
    
    # Enable MFA
    update_user(user_id, {'mfa_enabled': True})
    
    return codes

def disable_mfa_for_user(user_id: str):
    """Disable MFA for a user"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Disable MFA
    update_user(user_id, {'mfa_enabled': False})

def get_user_mfa_codes(user_id: str) -> list[dict]:
    """Get user's MFA backup codes"""
    return get_user_backup_codes(user_id)

# User class for backwards compatibility
class User:
    def __init__(self, user_dict):
        self.id = user_dict.get('id')
        self.name = user_dict.get('name')
        self.email = user_dict.get('email')
        self.hashed_password = user_dict.get('hashed_password')
        self.avatar = user_dict.get('avatar')
        self.color = user_dict.get('color', '#3b82f6')
        self.is_active = user_dict.get('is_active', True)
        self.is_verified = user_dict.get('is_verified', False)
        self.mfa_enabled = user_dict.get('mfa_enabled', False)
        self.created_at = user_dict.get('created_at')
        self.updated_at = user_dict.get('updated_at')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'hashed_password': self.hashed_password,
            'avatar': self.avatar,
            'color': self.color,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'mfa_enabled': self.mfa_enabled,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
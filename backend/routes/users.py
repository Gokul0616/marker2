from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from ..database import get_db, User
from ..auth import get_current_active_user, UserResponse, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all users (paginated)"""
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return [UserResponse.from_orm(user) for user in users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.from_orm(user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile"""
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.color is not None:
        current_user.color = user_update.color
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)

@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user password"""
    from ..auth import verify_password
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.delete("/me")
async def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate current user account"""
    current_user.is_active = False
    db.commit()
    
    return {"message": "Account deactivated successfully"}
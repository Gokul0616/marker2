from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
import uuid

from database import get_user_by_id, update_user
from auth import get_current_active_user, UserResponse, get_password_hash, verify_password

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
    current_user: dict = Depends(get_current_active_user)
):
    """Get all users (paginated) - simplified for MongoDB"""
    # For now, return empty list since we don't have a global user search in MongoDB
    return []

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get user by ID"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.from_orm(user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update current user profile"""
    update_data = {}
    
    if user_update.name is not None:
        update_data['name'] = user_update.name
    if user_update.avatar is not None:
        update_data['avatar'] = user_update.avatar
    if user_update.color is not None:
        update_data['color'] = user_update.color
    
    if update_data:
        success = update_user(current_user['id'], update_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user"
            )
    
    # Return updated user
    updated_user = get_user_by_id(current_user['id'])
    return UserResponse.from_orm(updated_user)

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: dict = Depends(get_current_active_user)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_change.current_password, current_user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_change.new_password)
    success = update_user(current_user['id'], {'hashed_password': new_hashed_password})
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to change password"
        )
    
    return {"message": "Password changed successfully"}
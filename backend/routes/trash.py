from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import (
    get_user_workspaces, get_workspace_by_id, get_user_by_id,
    get_trash_items as db_get_trash_items, restore_item, permanently_delete_item, empty_trash
)
from auth import get_current_active_user, UserResponse

router = APIRouter(prefix="/trash", tags=["trash"])

class TrashItem(BaseModel):
    id: str
    title: str
    icon: str
    type: str  # 'page' or 'database'
    workspace_id: str
    workspace_name: str
    deleted_at: str
    deleted_by: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class TrashResponse(BaseModel):
    items: List[TrashItem]
    count: int

@router.get("/", response_model=TrashResponse)
async def get_trash_items(
    workspace_id: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all trash items for current user's workspaces"""
    
    # Get user's workspaces
    user_workspaces = get_user_workspaces(current_user['id'])
    
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    # Filter by specific workspace if provided
    if workspace_id:
        if workspace_id not in workspace_ids:
            raise HTTPException(status_code=403, detail="Access denied to workspace")
        workspace_ids = [workspace_id]
    
    # Get trash items
    trash_items_raw = db_get_trash_items(workspace_ids)
    
    # Convert to response format
    trash_items = []
    for item in trash_items_raw:
        # Get workspace name
        workspace = get_workspace_by_id(item['workspace_id'])
        workspace_name = workspace['name'] if workspace else "Unknown Workspace"
        
        # Get deleted by user
        deleted_by_user = get_user_by_id(item['deleted_by']) if item.get('deleted_by') else None
        
        # Determine title based on type
        if item['type'] == 'page':
            title = item.get('title', 'Untitled Page')
            icon = item.get('icon', '📄')
        else:  # database
            title = item.get('name', 'Untitled Database')
            icon = '🗄️'
        
        trash_items.append(TrashItem(
            id=item['id'],
            title=title,
            icon=icon,
            type=item['type'],
            workspace_id=item['workspace_id'],
            workspace_name=workspace_name,
            deleted_at=item['deleted_at'],
            deleted_by=UserResponse.from_orm(deleted_by_user) if deleted_by_user else None
        ))
    
    # Sort by deleted_at (newest first)
    trash_items.sort(key=lambda x: x.deleted_at, reverse=True)
    
    return TrashResponse(items=trash_items, count=len(trash_items))

@router.post("/{item_id}/restore")
async def restore_item_endpoint(
    item_id: str,
    item_type: str,  # 'page' or 'database'
    current_user: dict = Depends(get_current_active_user)
):
    """Restore an item from trash"""
    
    # Get user's workspaces
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    # Get the item to check workspace access
    trash_items_raw = db_get_trash_items(workspace_ids)
    item = next((item for item in trash_items_raw if item['id'] == item_id and item['type'] == item_type), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in trash")
    
    # Restore the item
    success = restore_item(item_id, item_type)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to restore item")
    
    return {"message": f"{item_type.title()} restored successfully"}

@router.delete("/{item_id}")
async def permanently_delete_item_endpoint(
    item_id: str,
    item_type: str,  # 'page' or 'database'
    current_user: dict = Depends(get_current_active_user)
):
    """Permanently delete an item from trash"""
    
    # Get user's workspaces
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    # Get the item to check workspace access
    trash_items_raw = db_get_trash_items(workspace_ids)
    item = next((item for item in trash_items_raw if item['id'] == item_id and item['type'] == item_type), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in trash")
    
    # Check if user has permission to delete
    workspace = get_workspace_by_id(item['workspace_id'])
    if workspace['owner_id'] != current_user['id'] and item['created_by'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Permanently delete the item
    success = permanently_delete_item(item_id, item_type)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete item")
    
    return {"message": f"{item_type.title()} permanently deleted"}

@router.post("/empty")
async def empty_trash_endpoint(
    workspace_id: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Empty trash (permanently delete all items)"""
    
    # Get user's workspaces
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    # Filter by specific workspace if provided
    if workspace_id:
        if workspace_id not in workspace_ids:
            raise HTTPException(status_code=403, detail="Access denied to workspace")
        workspace_ids = [workspace_id]
    
    # Empty trash
    total_deleted = empty_trash(workspace_ids)
    
    return {"message": f"Trash emptied successfully. {total_deleted} items permanently deleted."}
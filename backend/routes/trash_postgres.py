from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import get_db, User, Page, Database, Workspace, workspace_members
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
    deleted_by: UserResponse
    
    class Config:
        from_attributes = True

class TrashResponse(BaseModel):
    items: List[TrashItem]
    count: int

@router.get("/", response_model=TrashResponse)
async def get_trash_items(
    workspace_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all trash items for current user's workspaces"""
    
    # Get user's workspaces
    user_workspaces = db.query(Workspace).join(workspace_members).filter(
        workspace_members.c.user_id == current_user.id
    ).all()
    
    workspace_ids = [str(ws.id) for ws in user_workspaces]
    
    # Filter by specific workspace if provided
    if workspace_id:
        if workspace_id not in workspace_ids:
            raise HTTPException(status_code=403, detail="Access denied to workspace")
        workspace_ids = [workspace_id]
    
    trash_items = []
    
    # Get deleted pages
    deleted_pages = db.query(Page).filter(
        Page.is_deleted == True,
        Page.workspace_id.in_([uuid.UUID(ws_id) for ws_id in workspace_ids])
    ).all()
    
    for page in deleted_pages:
        workspace = next(ws for ws in user_workspaces if str(ws.id) == str(page.workspace_id))
        deleted_by_user = db.query(User).filter(User.id == page.deleted_by).first()
        
        trash_items.append(TrashItem(
            id=str(page.id),
            title=page.title,
            icon=page.icon,
            type='page',
            workspace_id=str(page.workspace_id),
            workspace_name=workspace.name,
            deleted_at=page.deleted_at.isoformat(),
            deleted_by=UserResponse.from_orm(deleted_by_user)
        ))
    
    # Get deleted databases
    deleted_databases = db.query(Database).filter(
        Database.is_deleted == True,
        Database.workspace_id.in_([uuid.UUID(ws_id) for ws_id in workspace_ids])
    ).all()
    
    for database in deleted_databases:
        workspace = next(ws for ws in user_workspaces if str(ws.id) == str(database.workspace_id))
        deleted_by_user = db.query(User).filter(User.id == database.deleted_by).first()
        
        trash_items.append(TrashItem(
            id=str(database.id),
            title=database.name,
            icon='🗄️',
            type='database',
            workspace_id=str(database.workspace_id),
            workspace_name=workspace.name,
            deleted_at=database.deleted_at.isoformat(),
            deleted_by=UserResponse.from_orm(deleted_by_user)
        ))
    
    # Sort by deleted_at (newest first)
    trash_items.sort(key=lambda x: x.deleted_at, reverse=True)
    
    return TrashResponse(items=trash_items, count=len(trash_items))

@router.post("/{item_id}/restore")
async def restore_item(
    item_id: str,
    item_type: str,  # 'page' or 'database'
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Restore an item from trash"""
    
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
    
    if item_type == 'page':
        item = db.query(Page).filter(Page.id == item_uuid, Page.is_deleted == True).first()
    elif item_type == 'database':
        item = db.query(Database).filter(Database.id == item_uuid, Database.is_deleted == True).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in trash")
    
    # Check if user has access to the workspace
    user_workspaces = db.query(Workspace).join(workspace_members).filter(
        workspace_members.c.user_id == current_user.id
    ).all()
    
    workspace_ids = [str(ws.id) for ws in user_workspaces]
    
    if str(item.workspace_id) not in workspace_ids:
        raise HTTPException(status_code=403, detail="Access denied to workspace")
    
    # Restore the item
    item.is_deleted = False
    item.deleted_at = None
    item.deleted_by = None
    item.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"{item_type.title()} restored successfully"}

@router.delete("/{item_id}")
async def permanently_delete_item(
    item_id: str,
    item_type: str,  # 'page' or 'database'
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Permanently delete an item from trash"""
    
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID format")
    
    if item_type == 'page':
        item = db.query(Page).filter(Page.id == item_uuid, Page.is_deleted == True).first()
    elif item_type == 'database':
        item = db.query(Database).filter(Database.id == item_uuid, Database.is_deleted == True).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in trash")
    
    # Check if user has access to the workspace
    user_workspaces = db.query(Workspace).join(workspace_members).filter(
        workspace_members.c.user_id == current_user.id
    ).all()
    
    workspace_ids = [str(ws.id) for ws in user_workspaces]
    
    if str(item.workspace_id) not in workspace_ids:
        raise HTTPException(status_code=403, detail="Access denied to workspace")
    
    # Check if user is the owner or has permission to delete
    workspace = db.query(Workspace).filter(Workspace.id == item.workspace_id).first()
    if workspace.owner_id != current_user.id and item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Permanently delete the item
    db.delete(item)
    db.commit()
    
    return {"message": f"{item_type.title()} permanently deleted"}

@router.post("/empty")
async def empty_trash(
    workspace_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Empty trash (permanently delete all items)"""
    
    # Get user's workspaces
    user_workspaces = db.query(Workspace).join(workspace_members).filter(
        workspace_members.c.user_id == current_user.id
    ).all()
    
    workspace_ids = [str(ws.id) for ws in user_workspaces]
    
    # Filter by specific workspace if provided
    if workspace_id:
        if workspace_id not in workspace_ids:
            raise HTTPException(status_code=403, detail="Access denied to workspace")
        workspace_ids = [workspace_id]
    
    # Delete all trash items
    deleted_pages = db.query(Page).filter(
        Page.is_deleted == True,
        Page.workspace_id.in_([uuid.UUID(ws_id) for ws_id in workspace_ids])
    ).all()
    
    deleted_databases = db.query(Database).filter(
        Database.is_deleted == True,
        Database.workspace_id.in_([uuid.UUID(ws_id) for ws_id in workspace_ids])
    ).all()
    
    total_deleted = len(deleted_pages) + len(deleted_databases)
    
    # Delete pages
    for page in deleted_pages:
        db.delete(page)
    
    # Delete databases
    for database in deleted_databases:
        db.delete(database)
    
    db.commit()
    
    return {"message": f"Trash emptied successfully. {total_deleted} items permanently deleted."}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
import json

from ..database import get_db, User, Workspace, workspace_members
from ..auth import get_current_active_user, UserResponse

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    icon: Optional[str] = "📁"
    settings: Optional[dict] = {}

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    settings: Optional[dict] = None

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    icon: str
    owner_id: str
    settings: dict
    created_at: str
    updated_at: str
    members: List[UserResponse]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkspaceResponse])
async def get_user_workspaces(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all workspaces for current user"""
    workspaces = db.query(Workspace).join(workspace_members).filter(
        workspace_members.c.user_id == current_user.id
    ).all()
    
    result = []
    for workspace in workspaces:
        members = [UserResponse.from_orm(member) for member in workspace.members]
        result.append(WorkspaceResponse(
            id=str(workspace.id),
            name=workspace.name,
            icon=workspace.icon,
            owner_id=str(workspace.owner_id),
            settings=json.loads(workspace.settings or "{}"),
            created_at=workspace.created_at.isoformat(),
            updated_at=workspace.updated_at.isoformat(),
            members=members
        ))
    
    return result

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get workspace by ID"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is a member
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    members = [UserResponse.from_orm(member) for member in workspace.members]
    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        icon=workspace.icon,
        owner_id=str(workspace.owner_id),
        settings=json.loads(workspace.settings or "{}"),
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        members=members
    )

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new workspace"""
    workspace = Workspace(
        id=uuid.uuid4(),
        name=workspace_data.name,
        icon=workspace_data.icon,
        owner_id=current_user.id,
        settings=json.dumps(workspace_data.settings)
    )
    
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    
    # Add creator as member
    from sqlalchemy import insert
    stmt = insert(workspace_members).values(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner"
    )
    db.execute(stmt)
    db.commit()
    
    members = [UserResponse.from_orm(current_user)]
    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        icon=workspace.icon,
        owner_id=str(workspace.owner_id),
        settings=json.loads(workspace.settings or "{}"),
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        members=members
    )

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_update: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can update workspace"
        )
    
    if workspace_update.name is not None:
        workspace.name = workspace_update.name
    if workspace_update.icon is not None:
        workspace.icon = workspace_update.icon
    if workspace_update.settings is not None:
        workspace.settings = json.dumps(workspace_update.settings)
    
    db.commit()
    db.refresh(workspace)
    
    members = [UserResponse.from_orm(member) for member in workspace.members]
    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        icon=workspace.icon,
        owner_id=str(workspace.owner_id),
        settings=json.loads(workspace.settings or "{}"),
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        members=members
    )

@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can delete workspace"
        )
    
    db.delete(workspace)
    db.commit()
    
    return {"message": "Workspace deleted successfully"}

@router.post("/{workspace_id}/members/{user_id}")
async def add_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add member to workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can add members"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already a member
    existing_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == workspace_id,
        workspace_members.c.user_id == user_id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member"
        )
    
    # Add member
    from sqlalchemy import insert
    stmt = insert(workspace_members).values(
        workspace_id=workspace_id,
        user_id=user_id,
        role="member"
    )
    db.execute(stmt)
    db.commit()
    
    return {"message": "Member added successfully"}

@router.delete("/{workspace_id}/members/{user_id}")
async def remove_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove member from workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can remove members"
        )
    
    # Can't remove owner
    if user_id == str(workspace.owner_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace owner"
        )
    
    # Remove member
    from sqlalchemy import delete
    stmt = delete(workspace_members).where(
        workspace_members.c.workspace_id == workspace_id,
        workspace_members.c.user_id == user_id
    )
    result = db.execute(stmt)
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    return {"message": "Member removed successfully"}
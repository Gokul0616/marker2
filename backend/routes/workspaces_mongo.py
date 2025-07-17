from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
import uuid

from database import (
    get_user_workspaces, get_workspace_by_id, create_workspace,
    update_workspace, delete_workspace, get_user_by_id
)
from auth import get_current_active_user, UserResponse

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    icon: str = '📁'
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    icon: str
    description: Optional[str] = None
    owner_id: str
    members: List[dict] = []
    settings: dict = {}
    created_at: str
    updated_at: Optional[str] = None

@router.get("/", response_model=List[WorkspaceResponse])
async def get_workspaces(current_user: dict = Depends(get_current_active_user)):
    """Get current user's workspaces"""
    workspaces = get_user_workspaces(current_user['id'])
    
    result = []
    for ws in workspaces:
        # Get member details
        members = []
        for member in ws.get('members', []):
            user = get_user_by_id(member.get('user_id'))
            if user:
                members.append({
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'avatar': user.get('avatar'),
                    'color': user.get('color', '#3b82f6'),
                    'role': member.get('role', 'member')
                })
        
        result.append(WorkspaceResponse(
            id=ws['id'],
            name=ws['name'],
            icon=ws['icon'],
            description=ws.get('description'),
            owner_id=ws['owner_id'],
            members=members,
            settings=ws.get('settings', {}),
            created_at=ws['created_at'],
            updated_at=ws.get('updated_at')
        ))
    
    return result

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get workspace by ID"""
    workspace = get_workspace_by_id(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user has access
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if workspace_id not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get member details
    members = []
    for member in workspace.get('members', []):
        user = get_user_by_id(member.get('user_id'))
        if user:
            members.append({
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user.get('avatar'),
                'color': user.get('color', '#3b82f6'),
                'role': member.get('role', 'member')
            })
    
    return WorkspaceResponse(
        id=workspace['id'],
        name=workspace['name'],
        icon=workspace['icon'],
        description=workspace.get('description'),
        owner_id=workspace['owner_id'],
        members=members,
        settings=workspace.get('settings', {}),
        created_at=workspace['created_at'],
        updated_at=workspace.get('updated_at')
    )

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace_endpoint(
    workspace_data: WorkspaceCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new workspace"""
    workspace_doc = {
        'name': workspace_data.name,
        'icon': workspace_data.icon,
        'description': workspace_data.description,
        'owner_id': current_user['id'],
        'members': [{'user_id': current_user['id'], 'role': 'owner'}],
        'settings': {}
    }
    
    workspace = create_workspace(workspace_doc)
    
    return WorkspaceResponse(
        id=workspace['id'],
        name=workspace['name'],
        icon=workspace['icon'],
        description=workspace.get('description'),
        owner_id=workspace['owner_id'],
        members=[{
            'id': current_user['id'],
            'name': current_user['name'],
            'email': current_user['email'],
            'avatar': current_user.get('avatar'),
            'color': current_user.get('color', '#3b82f6'),
            'role': 'owner'
        }],
        settings=workspace.get('settings', {}),
        created_at=workspace['created_at'],
        updated_at=workspace.get('updated_at')
    )

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace_endpoint(
    workspace_id: str,
    workspace_data: WorkspaceUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update workspace"""
    workspace = get_workspace_by_id(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace['owner_id'] != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can update workspace"
        )
    
    # Prepare update data
    update_data = {}
    if workspace_data.name is not None:
        update_data['name'] = workspace_data.name
    if workspace_data.icon is not None:
        update_data['icon'] = workspace_data.icon
    if workspace_data.description is not None:
        update_data['description'] = workspace_data.description
    if workspace_data.settings is not None:
        update_data['settings'] = workspace_data.settings
    
    # Update workspace
    success = update_workspace(workspace_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update workspace"
        )
    
    # Return updated workspace
    updated_workspace = get_workspace_by_id(workspace_id)
    
    # Get member details
    members = []
    for member in updated_workspace.get('members', []):
        user = get_user_by_id(member.get('user_id'))
        if user:
            members.append({
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'avatar': user.get('avatar'),
                'color': user.get('color', '#3b82f6'),
                'role': member.get('role', 'member')
            })
    
    return WorkspaceResponse(
        id=updated_workspace['id'],
        name=updated_workspace['name'],
        icon=updated_workspace['icon'],
        description=updated_workspace.get('description'),
        owner_id=updated_workspace['owner_id'],
        members=members,
        settings=updated_workspace.get('settings', {}),
        created_at=updated_workspace['created_at'],
        updated_at=updated_workspace.get('updated_at')
    )

@router.delete("/{workspace_id}")
async def delete_workspace_endpoint(
    workspace_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete workspace"""
    workspace = get_workspace_by_id(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is owner
    if workspace['owner_id'] != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owner can delete workspace"
        )
    
    # Delete workspace
    success = delete_workspace(workspace_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete workspace"
        )
    
    return {"message": "Workspace deleted successfully"}
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from database import (
    get_user_workspaces, get_workspace_databases, get_database_by_id,
    create_database, update_database, delete_database
)
from auth import get_current_active_user

router = APIRouter(prefix="/databases", tags=["databases"])

class DatabaseCreate(BaseModel):
    name: str
    workspace_id: str
    properties: Optional[dict] = {}
    views: Optional[List[dict]] = []

class DatabaseUpdate(BaseModel):
    name: Optional[str] = None
    properties: Optional[dict] = None
    views: Optional[List[dict]] = None
    rows: Optional[List[dict]] = None

class DatabaseResponse(BaseModel):
    id: str
    name: str
    workspace_id: str
    created_by: str
    properties: dict = {}
    views: List[dict] = []
    rows: List[dict] = []
    is_deleted: bool = False
    created_at: str
    updated_at: Optional[str] = None

@router.get("/", response_model=List[DatabaseResponse])
async def get_databases(
    workspace_id: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get databases"""
    if workspace_id:
        # Check if user has access to workspace
        user_workspaces = get_user_workspaces(current_user['id'])
        workspace_ids = [ws['id'] for ws in user_workspaces]
        
        if workspace_id not in workspace_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to workspace"
            )
        
        databases = get_workspace_databases(workspace_id)
    else:
        databases = []
    
    return [
        DatabaseResponse(
            id=db['id'],
            name=db['name'],
            workspace_id=db['workspace_id'],
            created_by=db['created_by'],
            properties=db.get('properties', {}),
            views=db.get('views', []),
            rows=db.get('rows', []),
            is_deleted=db.get('is_deleted', False),
            created_at=db['created_at'],
            updated_at=db.get('updated_at')
        )
        for db in databases
    ]

@router.get("/{database_id}", response_model=DatabaseResponse)
async def get_database(
    database_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get database by ID"""
    database = get_database_by_id(database_id)
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if database['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return DatabaseResponse(
        id=database['id'],
        name=database['name'],
        workspace_id=database['workspace_id'],
        created_by=database['created_by'],
        properties=database.get('properties', {}),
        views=database.get('views', []),
        rows=database.get('rows', []),
        is_deleted=database.get('is_deleted', False),
        created_at=database['created_at'],
        updated_at=database.get('updated_at')
    )

@router.post("/", response_model=DatabaseResponse)
async def create_database_endpoint(
    database_data: DatabaseCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new database"""
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if database_data.workspace_id not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to workspace"
        )
    
    database_doc = {
        'name': database_data.name,
        'workspace_id': database_data.workspace_id,
        'created_by': current_user['id'],
        'properties': database_data.properties or {},
        'views': database_data.views or [],
        'rows': [],
        'is_deleted': False
    }
    
    database = create_database(database_doc)
    
    return DatabaseResponse(
        id=database['id'],
        name=database['name'],
        workspace_id=database['workspace_id'],
        created_by=database['created_by'],
        properties=database.get('properties', {}),
        views=database.get('views', []),
        rows=database.get('rows', []),
        is_deleted=database.get('is_deleted', False),
        created_at=database['created_at'],
        updated_at=database.get('updated_at')
    )

@router.put("/{database_id}", response_model=DatabaseResponse)
async def update_database_endpoint(
    database_id: str,
    database_data: DatabaseUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update database"""
    database = get_database_by_id(database_id)
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if database['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Prepare update data
    update_data = {}
    if database_data.name is not None:
        update_data['name'] = database_data.name
    if database_data.properties is not None:
        update_data['properties'] = database_data.properties
    if database_data.views is not None:
        update_data['views'] = database_data.views
    if database_data.rows is not None:
        update_data['rows'] = database_data.rows
    
    # Update database
    success = update_database(database_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update database"
        )
    
    # Return updated database
    updated_database = get_database_by_id(database_id)
    
    return DatabaseResponse(
        id=updated_database['id'],
        name=updated_database['name'],
        workspace_id=updated_database['workspace_id'],
        created_by=updated_database['created_by'],
        properties=updated_database.get('properties', {}),
        views=updated_database.get('views', []),
        rows=updated_database.get('rows', []),
        is_deleted=updated_database.get('is_deleted', False),
        created_at=updated_database['created_at'],
        updated_at=updated_database.get('updated_at')
    )

@router.delete("/{database_id}")
async def delete_database_endpoint(
    database_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete database (soft delete)"""
    database = get_database_by_id(database_id)
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if database['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete database
    success = delete_database(database_id, current_user['id'])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete database"
        )
    
    return {"message": "Database deleted successfully"}
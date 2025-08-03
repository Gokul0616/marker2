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

# Database Row endpoints
class DatabaseRowCreate(BaseModel):
    database_id: str
    properties: dict

class DatabaseRowUpdate(BaseModel):
    properties: dict

class DatabaseRowResponse(BaseModel):
    id: str
    database_id: str
    properties: dict = {}
    created_at: str
    updated_at: Optional[str] = None

@router.get("/{database_id}/rows", response_model=List[DatabaseRowResponse])
async def get_database_rows(
    database_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get database rows"""
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
    
    rows = database.get('rows', [])
    return [
        DatabaseRowResponse(
            id=row.get('id', str(uuid.uuid4())),
            database_id=database_id,
            properties=row.get('properties', {}),
            created_at=row.get('created_at', ''),
            updated_at=row.get('updated_at')
        )
        for row in rows
    ]

@router.post("/{database_id}/rows", response_model=DatabaseRowResponse)
async def create_database_row(
    database_id: str,
    row_data: DatabaseRowCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new database row"""
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
    
    # Create new row
    new_row = {
        'id': str(uuid.uuid4()),
        'properties': row_data.properties,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': None
    }
    
    # Add row to database
    current_rows = database.get('rows', [])
    current_rows.append(new_row)
    
    # Update database with new row
    success = update_database(database_id, {'rows': current_rows})
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create row"
        )
    
    return DatabaseRowResponse(
        id=new_row['id'],
        database_id=database_id,
        properties=new_row['properties'],
        created_at=new_row['created_at'],
        updated_at=new_row['updated_at']
    )

@router.put("/{database_id}/rows/{row_id}", response_model=DatabaseRowResponse)
async def update_database_row(
    database_id: str,
    row_id: str,
    row_data: DatabaseRowUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update database row"""
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
    
    # Find and update row
    current_rows = database.get('rows', [])
    row_found = False
    
    for i, row in enumerate(current_rows):
        if row.get('id') == row_id:
            current_rows[i]['properties'] = row_data.properties
            current_rows[i]['updated_at'] = datetime.utcnow().isoformat()
            row_found = True
            break
    
    if not row_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Row not found"
        )
    
    # Update database with modified rows
    success = update_database(database_id, {'rows': current_rows})
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update row"
        )
    
    # Return updated row
    updated_row = next(row for row in current_rows if row.get('id') == row_id)
    return DatabaseRowResponse(
        id=updated_row['id'],
        database_id=database_id,
        properties=updated_row['properties'],
        created_at=updated_row['created_at'],
        updated_at=updated_row['updated_at']
    )

@router.delete("/{database_id}/rows/{row_id}")
async def delete_database_row(
    database_id: str,
    row_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete database row"""
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
    
    # Remove row from database
    current_rows = database.get('rows', [])
    updated_rows = [row for row in current_rows if row.get('id') != row_id]
    
    if len(updated_rows) == len(current_rows):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Row not found"
        )
    
    # Update database with remaining rows
    success = update_database(database_id, {'rows': updated_rows})
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete row"
        )
    
    return {"message": "Row deleted successfully"}
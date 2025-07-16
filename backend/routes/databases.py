from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
import json

from ..database import get_db, User, Database, DatabaseRow, Workspace, workspace_members
from ..auth import get_current_active_user

router = APIRouter(prefix="/databases", tags=["databases"])

class DatabaseCreate(BaseModel):
    name: str
    workspace_id: str
    properties: dict
    views: Optional[List[dict]] = []

class DatabaseUpdate(BaseModel):
    name: Optional[str] = None
    properties: Optional[dict] = None
    views: Optional[List[dict]] = None

class DatabaseResponse(BaseModel):
    id: str
    name: str
    workspace_id: str
    properties: dict
    views: List[dict]
    created_by: str
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

class DatabaseRowCreate(BaseModel):
    database_id: str
    properties: dict

class DatabaseRowUpdate(BaseModel):
    properties: dict

class DatabaseRowResponse(BaseModel):
    id: str
    database_id: str
    properties: dict
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DatabaseResponse])
async def get_databases(
    workspace_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get databases for current user"""
    query = db.query(Database)
    
    if workspace_id:
        # Check if user is a member of the workspace
        is_member = db.query(workspace_members).filter(
            workspace_members.c.workspace_id == workspace_id,
            workspace_members.c.user_id == current_user.id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this workspace"
            )
        
        query = query.filter(Database.workspace_id == workspace_id)
    else:
        # Get databases from all workspaces user is a member of
        user_workspaces = db.query(workspace_members.c.workspace_id).filter(
            workspace_members.c.user_id == current_user.id
        ).subquery()
        
        query = query.filter(Database.workspace_id.in_(user_workspaces))
    
    databases = query.all()
    
    result = []
    for database in databases:
        result.append(DatabaseResponse(
            id=str(database.id),
            name=database.name,
            workspace_id=str(database.workspace_id),
            properties=json.loads(database.properties or "{}"),
            views=json.loads(database.views or "[]"),
            created_by=str(database.created_by),
            created_at=database.created_at.isoformat(),
            updated_at=database.updated_at.isoformat()
        ))
    
    return result

@router.get("/{database_id}", response_model=DatabaseResponse)
async def get_database(
    database_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get database by ID"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    return DatabaseResponse(
        id=str(database.id),
        name=database.name,
        workspace_id=str(database.workspace_id),
        properties=json.loads(database.properties or "{}"),
        views=json.loads(database.views or "[]"),
        created_by=str(database.created_by),
        created_at=database.created_at.isoformat(),
        updated_at=database.updated_at.isoformat()
    )

@router.post("/", response_model=DatabaseResponse)
async def create_database(
    database_data: DatabaseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new database"""
    # Check if workspace exists and user has access
    workspace = db.query(Workspace).filter(Workspace.id == database_data.workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database_data.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Create database
    database = Database(
        id=uuid.uuid4(),
        name=database_data.name,
        workspace_id=database_data.workspace_id,
        properties=json.dumps(database_data.properties),
        views=json.dumps(database_data.views),
        created_by=current_user.id
    )
    
    db.add(database)
    db.commit()
    db.refresh(database)
    
    return DatabaseResponse(
        id=str(database.id),
        name=database.name,
        workspace_id=str(database.workspace_id),
        properties=json.loads(database.properties or "{}"),
        views=json.loads(database.views or "[]"),
        created_by=str(database.created_by),
        created_at=database.created_at.isoformat(),
        updated_at=database.updated_at.isoformat()
    )

@router.put("/{database_id}", response_model=DatabaseResponse)
async def update_database(
    database_id: str,
    database_update: DatabaseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update database"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    if database_update.name is not None:
        database.name = database_update.name
    if database_update.properties is not None:
        database.properties = json.dumps(database_update.properties)
    if database_update.views is not None:
        database.views = json.dumps(database_update.views)
    
    db.commit()
    db.refresh(database)
    
    return DatabaseResponse(
        id=str(database.id),
        name=database.name,
        workspace_id=str(database.workspace_id),
        properties=json.loads(database.properties or "{}"),
        views=json.loads(database.views or "[]"),
        created_by=str(database.created_by),
        created_at=database.created_at.isoformat(),
        updated_at=database.updated_at.isoformat()
    )

@router.delete("/{database_id}")
async def delete_database(
    database_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete database"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user is creator or workspace owner
    workspace = db.query(Workspace).filter(Workspace.id == database.workspace_id).first()
    if database.created_by != current_user.id and workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only database creator or workspace owner can delete database"
        )
    
    db.delete(database)
    db.commit()
    
    return {"message": "Database deleted successfully"}

# Database rows endpoints
@router.get("/{database_id}/rows", response_model=List[DatabaseRowResponse])
async def get_database_rows(
    database_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all rows for a database"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    rows = db.query(DatabaseRow).filter(DatabaseRow.database_id == database_id).all()
    
    result = []
    for row in rows:
        result.append(DatabaseRowResponse(
            id=str(row.id),
            database_id=str(row.database_id),
            properties=json.loads(row.properties or "{}"),
            created_at=row.created_at.isoformat(),
            updated_at=row.updated_at.isoformat()
        ))
    
    return result

@router.post("/{database_id}/rows", response_model=DatabaseRowResponse)
async def create_database_row(
    database_id: str,
    row_data: DatabaseRowCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new row in database"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Create row
    row = DatabaseRow(
        id=uuid.uuid4(),
        database_id=database_id,
        properties=json.dumps(row_data.properties)
    )
    
    db.add(row)
    db.commit()
    db.refresh(row)
    
    return DatabaseRowResponse(
        id=str(row.id),
        database_id=str(row.database_id),
        properties=json.loads(row.properties or "{}"),
        created_at=row.created_at.isoformat(),
        updated_at=row.updated_at.isoformat()
    )

@router.put("/{database_id}/rows/{row_id}", response_model=DatabaseRowResponse)
async def update_database_row(
    database_id: str,
    row_id: str,
    row_update: DatabaseRowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a database row"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    row = db.query(DatabaseRow).filter(
        DatabaseRow.id == row_id,
        DatabaseRow.database_id == database_id
    ).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Row not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    row.properties = json.dumps(row_update.properties)
    db.commit()
    db.refresh(row)
    
    return DatabaseRowResponse(
        id=str(row.id),
        database_id=str(row.database_id),
        properties=json.loads(row.properties or "{}"),
        created_at=row.created_at.isoformat(),
        updated_at=row.updated_at.isoformat()
    )

@router.delete("/{database_id}/rows/{row_id}")
async def delete_database_row(
    database_id: str,
    row_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a database row"""
    database = db.query(Database).filter(Database.id == database_id).first()
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    row = db.query(DatabaseRow).filter(
        DatabaseRow.id == row_id,
        DatabaseRow.database_id == database_id
    ).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Row not found"
        )
    
    # Check if user is a member of the workspace
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == database.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    db.delete(row)
    db.commit()
    
    return {"message": "Row deleted successfully"}
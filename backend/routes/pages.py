from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
import json

from database import get_db, User, Page, Workspace, page_permissions
from auth import get_current_active_user, UserResponse

router = APIRouter(prefix="/pages", tags=["pages"])

class PageCreate(BaseModel):
    title: str
    icon: Optional[str] = "📄"
    parent_id: Optional[str] = None
    workspace_id: str
    content: Optional[List[dict]] = []

class PageUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    content: Optional[List[dict]] = None

class PageResponse(BaseModel):
    id: str
    title: str
    icon: str
    parent_id: Optional[str] = None
    workspace_id: str
    content: List[dict]
    created_by: str
    created_at: str
    updated_at: str
    permissions: dict
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[PageResponse])
async def get_pages(
    workspace_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get pages for current user"""
    query = db.query(Page).join(page_permissions).filter(
        page_permissions.c.user_id == current_user.id
    )
    
    if workspace_id:
        query = query.filter(Page.workspace_id == workspace_id)
    
    if parent_id:
        query = query.filter(Page.parent_id == parent_id)
    elif parent_id is None:
        query = query.filter(Page.parent_id.is_(None))
    
    pages = query.all()
    
    result = []
    for page in pages:
        result.append(PageResponse(
            id=str(page.id),
            title=page.title,
            icon=page.icon,
            parent_id=str(page.parent_id) if page.parent_id else None,
            workspace_id=str(page.workspace_id),
            content=json.loads(page.content or "[]"),
            created_by=str(page.created_by),
            created_at=page.created_at.isoformat(),
            updated_at=page.updated_at.isoformat(),
            permissions={
                "public": False,
                "allowComments": True,
                "allowEditing": True
            }
        ))
    
    return result

@router.get("/{page_id}", response_model=PageResponse)
async def get_page(
    page_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get page by ID"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check permissions
    has_permission = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == current_user.id
    ).first()
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to access this page"
        )
    
    return PageResponse(
        id=str(page.id),
        title=page.title,
        icon=page.icon,
        parent_id=str(page.parent_id) if page.parent_id else None,
        workspace_id=str(page.workspace_id),
        content=json.loads(page.content or "[]"),
        created_by=str(page.created_by),
        created_at=page.created_at.isoformat(),
        updated_at=page.updated_at.isoformat(),
        permissions={
            "public": False,
            "allowComments": True,
            "allowEditing": True
        }
    )

@router.post("/", response_model=PageResponse)
async def create_page(
    page_data: PageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new page"""
    # Check if workspace exists and user has access
    workspace = db.query(Workspace).filter(Workspace.id == page_data.workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user is a member of the workspace
    from database import workspace_members
    is_member = db.query(workspace_members).filter(
        workspace_members.c.workspace_id == page_data.workspace_id,
        workspace_members.c.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Create page
    page = Page(
        id=uuid.uuid4(),
        title=page_data.title,
        icon=page_data.icon,
        parent_id=page_data.parent_id,
        workspace_id=page_data.workspace_id,
        content=json.dumps(page_data.content),
        created_by=current_user.id
    )
    
    db.add(page)
    db.commit()
    db.refresh(page)
    
    # Add creator permissions
    from sqlalchemy import insert
    stmt = insert(page_permissions).values(
        page_id=page.id,
        user_id=current_user.id,
        permission="owner"
    )
    db.execute(stmt)
    db.commit()
    
    return PageResponse(
        id=str(page.id),
        title=page.title,
        icon=page.icon,
        parent_id=str(page.parent_id) if page.parent_id else None,
        workspace_id=str(page.workspace_id),
        content=json.loads(page.content or "[]"),
        created_by=str(page.created_by),
        created_at=page.created_at.isoformat(),
        updated_at=page.updated_at.isoformat(),
        permissions={
            "public": False,
            "allowComments": True,
            "allowEditing": True
        }
    )

@router.put("/{page_id}", response_model=PageResponse)
async def update_page(
    page_id: str,
    page_update: PageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update page"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check permissions
    has_permission = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == current_user.id,
        page_permissions.c.permission.in_(["owner", "editor"])
    ).first()
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to edit this page"
        )
    
    if page_update.title is not None:
        page.title = page_update.title
    if page_update.icon is not None:
        page.icon = page_update.icon
    if page_update.content is not None:
        page.content = json.dumps(page_update.content)
    
    db.commit()
    db.refresh(page)
    
    return PageResponse(
        id=str(page.id),
        title=page.title,
        icon=page.icon,
        parent_id=str(page.parent_id) if page.parent_id else None,
        workspace_id=str(page.workspace_id),
        content=json.loads(page.content or "[]"),
        created_by=str(page.created_by),
        created_at=page.created_at.isoformat(),
        updated_at=page.updated_at.isoformat(),
        permissions={
            "public": False,
            "allowComments": True,
            "allowEditing": True
        }
    )

@router.delete("/{page_id}")
async def delete_page(
    page_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete page"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check permissions
    has_permission = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == current_user.id,
        page_permissions.c.permission == "owner"
    ).first()
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only page owner can delete page"
        )
    
    db.delete(page)
    db.commit()
    
    return {"message": "Page deleted successfully"}

@router.post("/{page_id}/permissions/{user_id}")
async def grant_page_permission(
    page_id: str,
    user_id: str,
    permission: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Grant page permission to user"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check if current user is owner
    is_owner = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == current_user.id,
        page_permissions.c.permission == "owner"
    ).first()
    
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only page owner can grant permissions"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if permission already exists
    existing_permission = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == user_id
    ).first()
    
    if existing_permission:
        # Update existing permission
        from sqlalchemy import update
        stmt = update(page_permissions).where(
            page_permissions.c.page_id == page_id,
            page_permissions.c.user_id == user_id
        ).values(permission=permission)
        db.execute(stmt)
    else:
        # Create new permission
        from sqlalchemy import insert
        stmt = insert(page_permissions).values(
            page_id=page_id,
            user_id=user_id,
            permission=permission
        )
        db.execute(stmt)
    
    db.commit()
    
    return {"message": "Permission granted successfully"}

@router.delete("/{page_id}/permissions/{user_id}")
async def revoke_page_permission(
    page_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Revoke page permission from user"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check if current user is owner
    is_owner = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == current_user.id,
        page_permissions.c.permission == "owner"
    ).first()
    
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only page owner can revoke permissions"
        )
    
    # Can't revoke owner permission
    target_permission = db.query(page_permissions).filter(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == user_id
    ).first()
    
    if target_permission and target_permission.permission == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke owner permission"
        )
    
    # Remove permission
    from sqlalchemy import delete
    stmt = delete(page_permissions).where(
        page_permissions.c.page_id == page_id,
        page_permissions.c.user_id == user_id
    )
    result = db.execute(stmt)
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    return {"message": "Permission revoked successfully"}
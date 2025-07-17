from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
import uuid

from database import (
    get_user_workspaces, get_workspace_pages, get_page_by_id,
    create_page, update_page, delete_page
)
from auth import get_current_active_user, UserResponse

router = APIRouter(prefix="/pages", tags=["pages"])

class PageCreate(BaseModel):
    title: str
    workspace_id: str
    parent_id: Optional[str] = None
    icon: str = '📄'

class PageUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    content: Optional[List[dict]] = None

class PageResponse(BaseModel):
    id: str
    title: str
    icon: str
    workspace_id: str
    parent_id: Optional[str] = None
    created_by: str
    content: List[dict] = []
    is_deleted: bool = False
    created_at: str
    updated_at: Optional[str] = None

@router.get("/", response_model=List[PageResponse])
async def get_pages(
    workspace_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get pages"""
    if workspace_id:
        # Check if user has access to workspace
        user_workspaces = get_user_workspaces(current_user['id'])
        workspace_ids = [ws['id'] for ws in user_workspaces]
        
        if workspace_id not in workspace_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to workspace"
            )
        
        pages = get_workspace_pages(workspace_id, parent_id)
    else:
        pages = []
    
    return [
        PageResponse(
            id=page['id'],
            title=page['title'],
            icon=page['icon'],
            workspace_id=page['workspace_id'],
            parent_id=page.get('parent_id'),
            created_by=page['created_by'],
            content=page.get('content', []),
            is_deleted=page.get('is_deleted', False),
            created_at=page['created_at'],
            updated_at=page.get('updated_at')
        )
        for page in pages
    ]

@router.get("/{page_id}", response_model=PageResponse)
async def get_page(
    page_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get page by ID"""
    page = get_page_by_id(page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if page['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return PageResponse(
        id=page['id'],
        title=page['title'],
        icon=page['icon'],
        workspace_id=page['workspace_id'],
        parent_id=page.get('parent_id'),
        created_by=page['created_by'],
        content=page.get('content', []),
        is_deleted=page.get('is_deleted', False),
        created_at=page['created_at'],
        updated_at=page.get('updated_at')
    )

@router.post("/", response_model=PageResponse)
async def create_page_endpoint(
    page_data: PageCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new page"""
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if page_data.workspace_id not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to workspace"
        )
    
    page_doc = {
        'title': page_data.title,
        'icon': page_data.icon,
        'workspace_id': page_data.workspace_id,
        'parent_id': page_data.parent_id,
        'created_by': current_user['id'],
        'content': [],
        'permissions': [],
        'is_deleted': False
    }
    
    page = create_page(page_doc)
    
    return PageResponse(
        id=page['id'],
        title=page['title'],
        icon=page['icon'],
        workspace_id=page['workspace_id'],
        parent_id=page.get('parent_id'),
        created_by=page['created_by'],
        content=page.get('content', []),
        is_deleted=page.get('is_deleted', False),
        created_at=page['created_at'],
        updated_at=page.get('updated_at')
    )

@router.put("/{page_id}", response_model=PageResponse)
async def update_page_endpoint(
    page_id: str,
    page_data: PageUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update page"""
    page = get_page_by_id(page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if page['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Prepare update data
    update_data = {}
    if page_data.title is not None:
        update_data['title'] = page_data.title
    if page_data.icon is not None:
        update_data['icon'] = page_data.icon
    if page_data.content is not None:
        update_data['content'] = page_data.content
    
    # Update page
    success = update_page(page_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update page"
        )
    
    # Return updated page
    updated_page = get_page_by_id(page_id)
    
    return PageResponse(
        id=updated_page['id'],
        title=updated_page['title'],
        icon=updated_page['icon'],
        workspace_id=updated_page['workspace_id'],
        parent_id=updated_page.get('parent_id'),
        created_by=updated_page['created_by'],
        content=updated_page.get('content', []),
        is_deleted=updated_page.get('is_deleted', False),
        created_at=updated_page['created_at'],
        updated_at=updated_page.get('updated_at')
    )

@router.delete("/{page_id}")
async def delete_page_endpoint(
    page_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete page (soft delete)"""
    page = get_page_by_id(page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    # Check if user has access to workspace
    user_workspaces = get_user_workspaces(current_user['id'])
    workspace_ids = [ws['id'] for ws in user_workspaces]
    
    if page['workspace_id'] not in workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete page
    success = delete_page(page_id, current_user['id'])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete page"
        )
    
    return {"message": "Page deleted successfully"}
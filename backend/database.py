from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from datetime import datetime, timedelta
import uuid
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/notion_clone')
client = MongoClient(MONGO_URL)
db = client.get_default_database()

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                # Only use _id as id if there's no existing id field
                if 'id' not in doc:
                    result['id'] = str(value)
                # Skip _id if there's already an id field
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

# Base model for documents
class DocumentBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# User model
class UserDocument(DocumentBase):
    name: str
    email: str
    hashed_password: str
    avatar: Optional[str] = None
    color: str = '#3b82f6'
    is_active: bool = True
    is_verified: bool = False
    mfa_enabled: bool = False
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# MFA Backup Codes model
class MFABackupCodeDocument(DocumentBase):
    user_id: str
    code: str
    used: bool = False
    used_at: Optional[datetime] = None

# Login Attempts model
class LoginAttemptDocument(DocumentBase):
    ip_address: str
    user_email: Optional[str] = None
    successful: bool = False
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

# Workspace model
class WorkspaceDocument(DocumentBase):
    name: str
    icon: str = '📁'
    description: Optional[str] = None
    owner_id: str
    members: List[Dict[str, Any]] = []  # List of {user_id: str, role: str}
    settings: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Page model  
class PageDocument(DocumentBase):
    title: str
    icon: str = '📄'
    content: List[Dict[str, Any]] = []  # List of blocks
    workspace_id: str
    parent_id: Optional[str] = None
    created_by: str
    permissions: List[Dict[str, Any]] = []  # List of {user_id: str, permission: str}
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Database model
class DatabaseDocument(DocumentBase):
    name: str
    workspace_id: str
    created_by: str
    properties: Dict[str, Any] = {}
    views: List[Dict[str, Any]] = []
    rows: List[Dict[str, Any]] = []
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Database Collections
users_collection = db.users
mfa_backup_codes_collection = db.mfa_backup_codes
login_attempts_collection = db.login_attempts
workspaces_collection = db.workspaces
pages_collection = db.pages
databases_collection = db.databases

# Helper functions for database operations
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    user = users_collection.find_one({"email": email})
    return serialize_doc(user)

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    user = users_collection.find_one({"id": user_id})
    return serialize_doc(user)

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user"""
    user_data['id'] = str(uuid.uuid4())
    user_data['created_at'] = datetime.utcnow()
    result = users_collection.insert_one(user_data)
    user_data['_id'] = result.inserted_id
    return serialize_doc(user_data)

def update_user(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user data"""
    update_data['updated_at'] = datetime.utcnow()
    result = users_collection.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def get_user_workspaces(user_id: str) -> List[Dict[str, Any]]:
    """Get workspaces where user is a member"""
    workspaces = workspaces_collection.find({
        "$or": [
            {"owner_id": user_id},
            {"members.user_id": user_id}
        ]
    })
    return [serialize_doc(ws) for ws in workspaces]

def get_workspace_by_id(workspace_id: str) -> Optional[Dict[str, Any]]:
    """Get workspace by ID"""
    workspace = workspaces_collection.find_one({"id": workspace_id})
    return serialize_doc(workspace)

def create_workspace(workspace_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new workspace"""
    workspace_data['id'] = str(uuid.uuid4())
    workspace_data['created_at'] = datetime.utcnow()
    result = workspaces_collection.insert_one(workspace_data)
    workspace_data['_id'] = result.inserted_id
    return serialize_doc(workspace_data)

def update_workspace(workspace_id: str, update_data: Dict[str, Any]) -> bool:
    """Update workspace data"""
    update_data['updated_at'] = datetime.utcnow()
    result = workspaces_collection.update_one(
        {"id": workspace_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_workspace(workspace_id: str) -> bool:
    """Delete workspace"""
    result = workspaces_collection.delete_one({"id": workspace_id})
    return result.deleted_count > 0

def get_workspace_pages(workspace_id: str, parent_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get pages in workspace"""
    query = {"workspace_id": workspace_id, "is_deleted": False}
    if parent_id:
        query["parent_id"] = parent_id
    else:
        query["parent_id"] = None
    
    pages = pages_collection.find(query)
    return [serialize_doc(page) for page in pages]

def get_page_by_id(page_id: str) -> Optional[Dict[str, Any]]:
    """Get page by ID"""
    page = pages_collection.find_one({"id": page_id})
    return serialize_doc(page)

def create_page(page_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new page"""
    page_data['id'] = str(uuid.uuid4())
    page_data['created_at'] = datetime.utcnow()
    result = pages_collection.insert_one(page_data)
    page_data['_id'] = result.inserted_id
    return serialize_doc(page_data)

def update_page(page_id: str, update_data: Dict[str, Any]) -> bool:
    """Update page data"""
    update_data['updated_at'] = datetime.utcnow()
    result = pages_collection.update_one(
        {"id": page_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_page(page_id: str, user_id: str) -> bool:
    """Soft delete a page"""
    result = pages_collection.update_one(
        {"id": page_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": datetime.utcnow(),
            "deleted_by": user_id,
            "updated_at": datetime.utcnow()
        }}
    )
    return result.modified_count > 0

def get_workspace_databases(workspace_id: str) -> List[Dict[str, Any]]:
    """Get databases in workspace"""
    databases = databases_collection.find({
        "workspace_id": workspace_id, 
        "is_deleted": False
    })
    return [serialize_doc(db) for db in databases]

def get_database_by_id(database_id: str) -> Optional[Dict[str, Any]]:
    """Get database by ID"""
    database = databases_collection.find_one({"id": database_id})
    return serialize_doc(database)

def create_database(database_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new database"""
    database_data['id'] = str(uuid.uuid4())
    database_data['created_at'] = datetime.utcnow()
    result = databases_collection.insert_one(database_data)
    database_data['_id'] = result.inserted_id
    return serialize_doc(database_data)

def update_database(database_id: str, update_data: Dict[str, Any]) -> bool:
    """Update database data"""
    update_data['updated_at'] = datetime.utcnow()
    result = databases_collection.update_one(
        {"id": database_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_database(database_id: str, user_id: str) -> bool:
    """Soft delete a database"""
    result = databases_collection.update_one(
        {"id": database_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": datetime.utcnow(),
            "deleted_by": user_id,
            "updated_at": datetime.utcnow()
        }}
    )
    return result.modified_count > 0

def get_trash_items(workspace_ids: List[str]) -> List[Dict[str, Any]]:
    """Get deleted items from workspaces"""
    trash_items = []
    
    # Get deleted pages
    deleted_pages = pages_collection.find({
        "workspace_id": {"$in": workspace_ids},
        "is_deleted": True
    })
    
    for page in deleted_pages:
        page_data = serialize_doc(page)
        page_data['type'] = 'page'
        trash_items.append(page_data)
    
    # Get deleted databases
    deleted_databases = databases_collection.find({
        "workspace_id": {"$in": workspace_ids},
        "is_deleted": True
    })
    
    for database in deleted_databases:
        db_data = serialize_doc(database)
        db_data['type'] = 'database'
        trash_items.append(db_data)
    
    return trash_items

def restore_item(item_id: str, item_type: str) -> bool:
    """Restore an item from trash"""
    collection = pages_collection if item_type == 'page' else databases_collection
    
    result = collection.update_one(
        {"id": item_id, "is_deleted": True},
        {"$set": {
            "is_deleted": False,
            "deleted_at": None,
            "deleted_by": None,
            "updated_at": datetime.utcnow()
        }}
    )
    return result.modified_count > 0

def permanently_delete_item(item_id: str, item_type: str) -> bool:
    """Permanently delete an item"""
    collection = pages_collection if item_type == 'page' else databases_collection
    
    result = collection.delete_one({"id": item_id, "is_deleted": True})
    return result.deleted_count > 0

def empty_trash(workspace_ids: List[str]) -> int:
    """Empty trash for workspaces"""
    deleted_count = 0
    
    # Delete pages
    result = pages_collection.delete_many({
        "workspace_id": {"$in": workspace_ids},
        "is_deleted": True
    })
    deleted_count += result.deleted_count
    
    # Delete databases
    result = databases_collection.delete_many({
        "workspace_id": {"$in": workspace_ids},
        "is_deleted": True
    })
    deleted_count += result.deleted_count
    
    return deleted_count

# MFA related functions
def get_user_backup_codes(user_id: str) -> List[Dict[str, Any]]:
    """Get user's MFA backup codes"""
    codes = mfa_backup_codes_collection.find({"user_id": user_id})
    return [serialize_doc(code) for code in codes]

def create_backup_codes(user_id: str, codes: List[str]) -> List[Dict[str, Any]]:
    """Create MFA backup codes for user"""
    # Delete existing codes
    mfa_backup_codes_collection.delete_many({"user_id": user_id})
    
    # Create new codes
    backup_codes = []
    for code in codes:
        code_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "code": code,
            "used": False,
            "created_at": datetime.utcnow()
        }
        backup_codes.append(code_data)
    
    if backup_codes:
        mfa_backup_codes_collection.insert_many(backup_codes)
    
    return [serialize_doc(code) for code in backup_codes]

def verify_backup_code(user_id: str, code: str) -> bool:
    """Verify and mark backup code as used"""
    result = mfa_backup_codes_collection.update_one(
        {"user_id": user_id, "code": code, "used": False},
        {"$set": {"used": True, "used_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

# Login attempts functions
def record_login_attempt(ip_address: str, user_email: Optional[str] = None, successful: bool = False) -> Dict[str, Any]:
    """Record a login attempt"""
    attempt_data = {
        "id": str(uuid.uuid4()),
        "ip_address": ip_address,
        "user_email": user_email,
        "successful": successful,
        "attempted_at": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = login_attempts_collection.insert_one(attempt_data)
    attempt_data['_id'] = result.inserted_id
    return serialize_doc(attempt_data)

def get_recent_login_attempts(ip_address: str, minutes: int = 30) -> List[Dict[str, Any]]:
    """Get recent login attempts from IP"""
    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
    
    attempts = login_attempts_collection.find({
        "ip_address": ip_address,
        "attempted_at": {"$gte": cutoff_time}
    })
    
    return [serialize_doc(attempt) for attempt in attempts]

# Index creation for better performance
def create_indexes():
    """Create database indexes"""
    # User indexes
    users_collection.create_index("email", unique=True)
    users_collection.create_index("id", unique=True)
    
    # Workspace indexes
    workspaces_collection.create_index("id", unique=True)
    workspaces_collection.create_index("owner_id")
    workspaces_collection.create_index("members.user_id")
    
    # Page indexes
    pages_collection.create_index("id", unique=True)
    pages_collection.create_index("workspace_id")
    pages_collection.create_index("parent_id")
    pages_collection.create_index("created_by")
    pages_collection.create_index("is_deleted")
    
    # Database indexes
    databases_collection.create_index("id", unique=True)
    databases_collection.create_index("workspace_id")
    databases_collection.create_index("created_by")
    databases_collection.create_index("is_deleted")
    
    # MFA backup codes indexes
    mfa_backup_codes_collection.create_index("user_id")
    mfa_backup_codes_collection.create_index("code")
    
    # Login attempts indexes
    login_attempts_collection.create_index("ip_address")
    login_attempts_collection.create_index("attempted_at")

# Create indexes on startup
create_indexes()
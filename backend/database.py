from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, Integer, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timedelta
import uuid
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Association table for workspace members
workspace_members = Table(
    'workspace_members',
    Base.metadata,
    Column('workspace_id', UUID(as_uuid=True), ForeignKey('workspaces.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('role', String(50), default='member')
)

# Association table for page permissions
page_permissions = Table(
    'page_permissions',
    Base.metadata,
    Column('page_id', UUID(as_uuid=True), ForeignKey('pages.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('permission', String(50), default='viewer')
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(String(500))
    color = Column(String(7), default='#3b82f6')
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    owned_workspaces = relationship("Workspace", back_populates="owner")
    pages = relationship("Page", secondary=page_permissions, back_populates="users")
    owned_pages = relationship("Page", back_populates="created_by_user")
    backup_codes = relationship("MFABackupCode", back_populates="user")
    login_attempts = relationship("LoginAttempt", back_populates="user")

class MFABackupCode(Base):
    __tablename__ = "mfa_backup_codes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    code = Column(String(10), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="backup_codes")

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500))
    success = Column(Boolean, default=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="login_attempts")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    icon = Column(String(10), default='📁')
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    settings = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    pages = relationship("Page", back_populates="workspace")
    databases = relationship("Database", back_populates="workspace")

class Page(Base):
    __tablename__ = "pages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    icon = Column(String(10), default='📄')
    parent_id = Column(UUID(as_uuid=True), ForeignKey('pages.id'), nullable=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey('workspaces.id'), nullable=False)
    content = Column(Text)  # JSON string
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Soft delete fields
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="pages")
    created_by_user = relationship("User", back_populates="owned_pages")
    users = relationship("User", secondary=page_permissions, back_populates="pages")
    parent = relationship("Page", remote_side=[id])
    children = relationship("Page")
    deleted_by_user = relationship("User", foreign_keys=[deleted_by])

class Database(Base):
    __tablename__ = "databases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey('workspaces.id'), nullable=False)
    properties = Column(Text)  # JSON string
    views = Column(Text)  # JSON string
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="databases")
    rows = relationship("DatabaseRow", back_populates="database")

class DatabaseRow(Base):
    __tablename__ = "database_rows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    database_id = Column(UUID(as_uuid=True), ForeignKey('databases.id'), nullable=False)
    properties = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    database = relationship("Database", back_populates="rows")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)
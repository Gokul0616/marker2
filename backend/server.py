from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# Import database and authentication
from database import create_tables
from routes import auth, users, workspaces, pages, databases

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Notion Clone API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workspaces.router)
api_router.include_router(pages.router)
api_router.include_router(databases.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test endpoint for backward compatibility
@api_router.get("/")
async def root():
    return {"message": "Notion Clone API is running"}

# Legacy status endpoints for backward compatibility
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    return []  # Empty list for backward compatibility

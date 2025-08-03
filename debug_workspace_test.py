#!/usr/bin/env python3
"""
Debug workspace access issue
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL')
API_BASE = f"{BACKEND_URL}/api"

def debug_workspace_access():
    session = requests.Session()
    
    # Login first
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123!@#"
    }
    
    login_response = session.post(f"{API_BASE}/auth/login", json=login_data)
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token_data = login_response.json()
    auth_token = token_data.get('access_token')
    session.headers.update({'Authorization': f'Bearer {auth_token}'})
    
    print("✅ Login successful")
    
    # Create a workspace
    workspace_data = {
        "name": "Debug Test Workspace",
        "icon": "🔧",
        "description": "Testing workspace access"
    }
    
    create_response = session.post(f"{API_BASE}/workspaces/", json=workspace_data)
    print(f"Create workspace response: {create_response.status_code}")
    print(f"Create response body: {create_response.text}")
    
    if create_response.status_code != 200:
        print("❌ Failed to create workspace")
        return
    
    workspace = create_response.json()
    workspace_id = workspace.get('id')
    print(f"✅ Workspace created: {workspace_id}")
    print(f"Workspace data: {json.dumps(workspace, indent=2)}")
    
    # Get all workspaces
    get_all_response = session.get(f"{API_BASE}/workspaces/")
    print(f"\nGet all workspaces response: {get_all_response.status_code}")
    if get_all_response.status_code == 200:
        workspaces = get_all_response.json()
        print(f"Found {len(workspaces)} workspaces")
        for ws in workspaces:
            print(f"  - {ws['id']}: {ws['name']}")
    else:
        print(f"Get all failed: {get_all_response.text}")
    
    # Try to get the specific workspace
    get_single_response = session.get(f"{API_BASE}/workspaces/{workspace_id}")
    print(f"\nGet single workspace response: {get_single_response.status_code}")
    print(f"Get single response body: {get_single_response.text}")
    
    # Try to create a page in this workspace
    page_data = {
        "title": "Debug Test Page",
        "workspace_id": workspace_id,
        "icon": "📝"
    }
    
    create_page_response = session.post(f"{API_BASE}/pages/", json=page_data)
    print(f"\nCreate page response: {create_page_response.status_code}")
    print(f"Create page response body: {create_page_response.text}")
    
    # Clean up
    delete_response = session.delete(f"{API_BASE}/workspaces/{workspace_id}")
    print(f"\nDelete workspace response: {delete_response.status_code}")

if __name__ == "__main__":
    debug_workspace_access()
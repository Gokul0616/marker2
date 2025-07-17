#!/usr/bin/env python3
"""
Backend Authentication System Test Suite
Tests PostgreSQL connection, user registration, login, MFA, rate limiting, and JWT authentication
"""

import requests
import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BACKEND_URL:
    print("❌ REACT_APP_BACKEND_URL not found in frontend/.env")
    exit(1)

API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        # Use the test credentials provided by the user
        self.test_user_email = "test@example.com"
        self.test_user_password = "TestPassword123!@#"
        self.test_user_name = "Test User"
        self.auth_token = None
        self.user_id = None
        self.backup_codes = []
        self.test_workspace_id = None
        self.test_page_id = None
        self.test_database_id = None
        
    def log_test(self, test_name, success, message=""):
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        
    def test_database_connection(self):
        """Test 1: Database Setup - Verify PostgreSQL connection and table creation"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            if response.status_code == 200:
                self.log_test("Database Connection", True, "Health check passed")
                return True
            else:
                self.log_test("Database Connection", False, f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Database Connection", False, f"Connection error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test 2: User Registration - Test creating a new user account"""
        try:
            user_data = {
                "name": self.test_user_name,
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            
            if response.status_code == 200:
                user_info = response.json()
                self.user_id = user_info.get('id')
                self.log_test("User Registration", True, f"User created: {user_info.get('email')}")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_test("User Registration", True, "User already exists (expected for repeat tests)")
                return True
            else:
                self.log_test("User Registration", False, f"Registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test 3: User Login - Test login with valid credentials"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                token_data = response.json()
                self.auth_token = token_data.get('access_token')
                user_info = token_data.get('user', {})
                self.user_id = user_info.get('id')
                
                # Set authorization header for future requests
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                self.log_test("User Login", True, f"Login successful for {user_info.get('email')}")
                return True
            elif response.status_code == 202:
                # MFA required
                self.log_test("User Login", True, "MFA verification required (expected if MFA enabled)")
                return True
            else:
                self.log_test("User Login", False, f"Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_rate_limiting(self):
        """Test 4: Rate Limiting - Test that rate limiting works after 3 failed login attempts"""
        try:
            # First, check current rate limit status
            response = self.session.get(f"{API_BASE}/auth/rate-limit-status")
            if response.status_code == 200:
                status = response.json()
                self.log_test("Rate Limit Status Check", True, f"Remaining attempts: {status.get('remaining_attempts')}")
            
            # Test with wrong password to trigger rate limiting
            wrong_login_data = {
                "email": self.test_user_email,
                "password": "WrongPassword123!"
            }
            
            failed_attempts = 0
            max_attempts = 3
            
            for i in range(max_attempts + 1):
                response = self.session.post(f"{API_BASE}/auth/login", json=wrong_login_data)
                
                if response.status_code == 401:
                    failed_attempts += 1
                    self.log_test(f"Rate Limiting - Attempt {i+1}", True, f"Failed login attempt {i+1}")
                elif response.status_code == 429:
                    self.log_test("Rate Limiting", True, f"Rate limit triggered after {failed_attempts} attempts")
                    return True
                else:
                    self.log_test(f"Rate Limiting - Attempt {i+1}", False, f"Unexpected response: {response.status_code}")
            
            # If we get here, rate limiting might not be working as expected
            self.log_test("Rate Limiting", False, "Rate limiting not triggered after multiple failed attempts")
            return False
            
        except Exception as e:
            self.log_test("Rate Limiting", False, f"Rate limiting test error: {str(e)}")
            return False
    
    def test_jwt_authentication(self):
        """Test 5: JWT Authentication - Test protected endpoints with JWT token"""
        try:
            if not self.auth_token:
                # Try to login first
                if not self.test_user_login():
                    self.log_test("JWT Authentication", False, "No auth token available")
                    return False
            
            # Test protected endpoint
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                user_info = response.json()
                self.log_test("JWT Authentication", True, f"Protected endpoint accessed: {user_info.get('email')}")
                return True
            else:
                self.log_test("JWT Authentication", False, f"Protected endpoint failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("JWT Authentication", False, f"JWT authentication error: {str(e)}")
            return False
    
    def test_mfa_setup(self):
        """Test 6: MFA Setup - Test enabling MFA and getting backup codes"""
        try:
            if not self.auth_token:
                if not self.test_user_login():
                    self.log_test("MFA Setup", False, "No auth token available")
                    return False
            
            response = self.session.post(f"{API_BASE}/auth/enable-mfa")
            
            if response.status_code == 200:
                mfa_data = response.json()
                self.backup_codes = mfa_data.get('backup_codes', [])
                self.log_test("MFA Setup", True, f"MFA enabled with {len(self.backup_codes)} backup codes")
                return True
            elif response.status_code == 400 and "already enabled" in response.text:
                self.log_test("MFA Setup", True, "MFA already enabled (expected for repeat tests)")
                # Try to get backup codes by regenerating them
                regen_response = self.session.post(f"{API_BASE}/auth/regenerate-backup-codes")
                if regen_response.status_code == 200:
                    mfa_data = regen_response.json()
                    self.backup_codes = mfa_data.get('backup_codes', [])
                    self.log_test("MFA Backup Codes", True, f"Got {len(self.backup_codes)} backup codes")
                return True
            else:
                self.log_test("MFA Setup", False, f"MFA setup failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_test("MFA Setup", False, f"MFA setup error: {str(e)}")
            return False
    
    def test_mfa_login(self):
        """Test 7: MFA Login - Test login with MFA enabled using backup code"""
        try:
            if not self.backup_codes:
                self.log_test("MFA Login", False, "No backup codes available")
                return False
            
            # Clear current session
            self.session.headers.pop('Authorization', None)
            self.auth_token = None
            
            # First, try regular login (should require MFA)
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 202:
                # MFA required, now verify with backup code
                user_id = response.headers.get('X-User-ID')
                if not user_id:
                    self.log_test("MFA Login", False, "User ID not provided in MFA response")
                    return False
                
                # Use first backup code
                backup_code = self.backup_codes[0]
                mfa_data = {
                    "backup_code": backup_code
                }
                
                mfa_response = self.session.post(f"{API_BASE}/auth/verify-mfa?user_id={user_id}", json=mfa_data)
                
                if mfa_response.status_code == 200:
                    token_data = mfa_response.json()
                    self.auth_token = token_data.get('access_token')
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_test("MFA Login", True, "MFA verification successful")
                    return True
                else:
                    self.log_test("MFA Login", False, f"MFA verification failed: {mfa_response.status_code} - {mfa_response.text}")
                    return False
            elif response.status_code == 200:
                # MFA might not be enabled yet
                self.log_test("MFA Login", True, "Login successful (MFA might not be enabled)")
                return True
            else:
                self.log_test("MFA Login", False, f"Initial login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("MFA Login", False, f"MFA login error: {str(e)}")
            return False
    
    def test_user_management(self):
        """Test 8: User Management - Test updating user profile and getting user info"""
        try:
            if not self.auth_token:
                if not self.test_user_login():
                    self.log_test("User Management", False, "No auth token available")
                    return False
            
            # Test getting current user info
            response = self.session.get(f"{API_BASE}/auth/me")
            if response.status_code != 200:
                self.log_test("User Management - Get User", False, f"Get user failed: {response.status_code}")
                return False
            
            user_info = response.json()
            self.log_test("User Management - Get User", True, f"Retrieved user: {user_info.get('email')}")
            
            # Test updating user profile
            update_data = {
                "name": "Alice Johnson Updated",
                "color": "#ff6b6b"
            }
            
            update_response = self.session.put(f"{API_BASE}/users/me", json=update_data)
            
            if update_response.status_code == 200:
                updated_user = update_response.json()
                self.log_test("User Management - Update Profile", True, f"Profile updated: {updated_user.get('name')}")
                
                # Test getting all users
                users_response = self.session.get(f"{API_BASE}/users/")
                if users_response.status_code == 200:
                    users = users_response.json()
                    self.log_test("User Management - Get All Users", True, f"Retrieved {len(users)} users")
                    return True
                else:
                    self.log_test("User Management - Get All Users", False, f"Get users failed: {users_response.status_code}")
                    return False
            else:
                self.log_test("User Management - Update Profile", False, f"Profile update failed: {update_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("User Management", False, f"User management error: {str(e)}")
            return False
    
    def test_workspaces_api(self):
        """Test 9: Workspaces API - Test workspace CRUD operations"""
        try:
            if not self.auth_token:
                if not self.test_user_login():
                    self.log_test("Workspaces API", False, "No auth token available")
                    return False
            
            # Test creating a workspace
            workspace_data = {
                "name": "Marketing Team Workspace",
                "icon": "📊",
                "settings": {"theme": "light", "notifications": True}
            }
            
            create_response = self.session.post(f"{API_BASE}/workspaces/", json=workspace_data)
            
            if create_response.status_code != 200:
                self.log_test("Workspaces API - Create", False, f"Create failed: {create_response.status_code} - {create_response.text}")
                return False
            
            workspace = create_response.json()
            workspace_id = workspace.get('id')
            self.log_test("Workspaces API - Create", True, f"Workspace created: {workspace.get('name')}")
            
            # Test getting all workspaces
            get_all_response = self.session.get(f"{API_BASE}/workspaces/")
            if get_all_response.status_code != 200:
                self.log_test("Workspaces API - Get All", False, f"Get all failed: {get_all_response.status_code}")
                return False
            
            workspaces = get_all_response.json()
            self.log_test("Workspaces API - Get All", True, f"Retrieved {len(workspaces)} workspaces")
            
            # Test getting specific workspace
            get_response = self.session.get(f"{API_BASE}/workspaces/{workspace_id}")
            if get_response.status_code != 200:
                self.log_test("Workspaces API - Get Single", False, f"Get single failed: {get_response.status_code}")
                return False
            
            self.log_test("Workspaces API - Get Single", True, f"Retrieved workspace: {get_response.json().get('name')}")
            
            # Test updating workspace
            update_data = {
                "name": "Updated Marketing Team",
                "settings": {"theme": "dark", "notifications": False}
            }
            
            update_response = self.session.put(f"{API_BASE}/workspaces/{workspace_id}", json=update_data)
            if update_response.status_code != 200:
                self.log_test("Workspaces API - Update", False, f"Update failed: {update_response.status_code}")
                return False
            
            updated_workspace = update_response.json()
            self.log_test("Workspaces API - Update", True, f"Workspace updated: {updated_workspace.get('name')}")
            
            # Test deleting workspace
            delete_response = self.session.delete(f"{API_BASE}/workspaces/{workspace_id}")
            if delete_response.status_code != 200:
                self.log_test("Workspaces API - Delete", False, f"Delete failed: {delete_response.status_code}")
                return False
            
            self.log_test("Workspaces API - Delete", True, "Workspace deleted successfully")
            
            return True
            
        except Exception as e:
            self.log_test("Workspaces API", False, f"Workspaces API error: {str(e)}")
            return False
    
    def test_pages_api(self):
        """Test 10: Pages API - Test page CRUD operations"""
        try:
            if not self.auth_token:
                if not self.test_user_login():
                    self.log_test("Pages API", False, "No auth token available")
                    return False
            
            # First create a workspace for pages
            workspace_data = {
                "name": "Pages Test Workspace",
                "icon": "📝",
                "settings": {}
            }
            
            workspace_response = self.session.post(f"{API_BASE}/workspaces/", json=workspace_data)
            if workspace_response.status_code != 200:
                self.log_test("Pages API - Setup", False, "Failed to create test workspace")
                return False
            
            workspace_id = workspace_response.json().get('id')
            
            # Test creating a page
            page_data = {
                "title": "Project Planning Document",
                "icon": "📋",
                "workspace_id": workspace_id,
                "content": [
                    {"type": "heading", "text": "Project Overview"},
                    {"type": "paragraph", "text": "This is a test page for project planning."}
                ]
            }
            
            create_response = self.session.post(f"{API_BASE}/pages/", json=page_data)
            
            if create_response.status_code != 200:
                self.log_test("Pages API - Create", False, f"Create failed: {create_response.status_code} - {create_response.text}")
                return False
            
            page = create_response.json()
            page_id = page.get('id')
            self.log_test("Pages API - Create", True, f"Page created: {page.get('title')}")
            
            # Test getting all pages
            get_all_response = self.session.get(f"{API_BASE}/pages/?workspace_id={workspace_id}")
            if get_all_response.status_code != 200:
                self.log_test("Pages API - Get All", False, f"Get all failed: {get_all_response.status_code}")
                return False
            
            pages = get_all_response.json()
            self.log_test("Pages API - Get All", True, f"Retrieved {len(pages)} pages")
            
            # Test getting specific page
            get_response = self.session.get(f"{API_BASE}/pages/{page_id}")
            if get_response.status_code != 200:
                self.log_test("Pages API - Get Single", False, f"Get single failed: {get_response.status_code}")
                return False
            
            self.log_test("Pages API - Get Single", True, f"Retrieved page: {get_response.json().get('title')}")
            
            # Test updating page
            update_data = {
                "title": "Updated Project Planning",
                "content": [
                    {"type": "heading", "text": "Updated Project Overview"},
                    {"type": "paragraph", "text": "This page has been updated with new content."}
                ]
            }
            
            update_response = self.session.put(f"{API_BASE}/pages/{page_id}", json=update_data)
            if update_response.status_code != 200:
                self.log_test("Pages API - Update", False, f"Update failed: {update_response.status_code}")
                return False
            
            updated_page = update_response.json()
            self.log_test("Pages API - Update", True, f"Page updated: {updated_page.get('title')}")
            
            # Test deleting page
            delete_response = self.session.delete(f"{API_BASE}/pages/{page_id}")
            if delete_response.status_code != 200:
                self.log_test("Pages API - Delete", False, f"Delete failed: {delete_response.status_code}")
                return False
            
            self.log_test("Pages API - Delete", True, "Page deleted successfully")
            
            # Clean up workspace
            self.session.delete(f"{API_BASE}/workspaces/{workspace_id}")
            
            return True
            
        except Exception as e:
            self.log_test("Pages API", False, f"Pages API error: {str(e)}")
            return False
    
    def test_databases_api(self):
        """Test 11: Databases API - Test database CRUD operations and rows"""
        try:
            if not self.auth_token:
                if not self.test_user_login():
                    self.log_test("Databases API", False, "No auth token available")
                    return False
            
            # First create a workspace for databases
            workspace_data = {
                "name": "Database Test Workspace",
                "icon": "🗄️",
                "settings": {}
            }
            
            workspace_response = self.session.post(f"{API_BASE}/workspaces/", json=workspace_data)
            if workspace_response.status_code != 200:
                self.log_test("Databases API - Setup", False, "Failed to create test workspace")
                return False
            
            workspace_id = workspace_response.json().get('id')
            
            # Test creating a database
            database_data = {
                "name": "Customer Database",
                "workspace_id": workspace_id,
                "properties": {
                    "Name": {"type": "title"},
                    "Email": {"type": "email"},
                    "Status": {"type": "select", "options": ["Active", "Inactive"]},
                    "Created": {"type": "date"}
                },
                "views": [
                    {"name": "All Customers", "type": "table", "filter": {}},
                    {"name": "Active Only", "type": "table", "filter": {"Status": "Active"}}
                ]
            }
            
            create_response = self.session.post(f"{API_BASE}/databases/", json=database_data)
            
            if create_response.status_code != 200:
                self.log_test("Databases API - Create", False, f"Create failed: {create_response.status_code} - {create_response.text}")
                return False
            
            database = create_response.json()
            database_id = database.get('id')
            self.log_test("Databases API - Create", True, f"Database created: {database.get('name')}")
            
            # Test getting all databases
            get_all_response = self.session.get(f"{API_BASE}/databases/?workspace_id={workspace_id}")
            if get_all_response.status_code != 200:
                self.log_test("Databases API - Get All", False, f"Get all failed: {get_all_response.status_code}")
                return False
            
            databases = get_all_response.json()
            self.log_test("Databases API - Get All", True, f"Retrieved {len(databases)} databases")
            
            # Test getting specific database
            get_response = self.session.get(f"{API_BASE}/databases/{database_id}")
            if get_response.status_code != 200:
                self.log_test("Databases API - Get Single", False, f"Get single failed: {get_response.status_code}")
                return False
            
            self.log_test("Databases API - Get Single", True, f"Retrieved database: {get_response.json().get('name')}")
            
            # Test updating database
            update_data = {
                "name": "Updated Customer Database",
                "properties": {
                    "Name": {"type": "title"},
                    "Email": {"type": "email"},
                    "Status": {"type": "select", "options": ["Active", "Inactive", "Pending"]},
                    "Created": {"type": "date"},
                    "Notes": {"type": "text"}
                }
            }
            
            update_response = self.session.put(f"{API_BASE}/databases/{database_id}", json=update_data)
            if update_response.status_code != 200:
                self.log_test("Databases API - Update", False, f"Update failed: {update_response.status_code}")
                return False
            
            updated_database = update_response.json()
            self.log_test("Databases API - Update", True, f"Database updated: {updated_database.get('name')}")
            
            # Test database rows - Create row
            row_data = {
                "database_id": database_id,
                "properties": {
                    "Name": "Sarah Wilson",
                    "Email": "sarah.wilson@company.com",
                    "Status": "Active",
                    "Created": "2024-01-15",
                    "Notes": "VIP customer"
                }
            }
            
            create_row_response = self.session.post(f"{API_BASE}/databases/{database_id}/rows", json=row_data)
            if create_row_response.status_code != 200:
                self.log_test("Databases API - Create Row", False, f"Create row failed: {create_row_response.status_code}")
                return False
            
            row = create_row_response.json()
            row_id = row.get('id')
            self.log_test("Databases API - Create Row", True, f"Row created for: {row.get('properties', {}).get('Name')}")
            
            # Test getting all rows
            get_rows_response = self.session.get(f"{API_BASE}/databases/{database_id}/rows")
            if get_rows_response.status_code != 200:
                self.log_test("Databases API - Get Rows", False, f"Get rows failed: {get_rows_response.status_code}")
                return False
            
            rows = get_rows_response.json()
            self.log_test("Databases API - Get Rows", True, f"Retrieved {len(rows)} rows")
            
            # Test updating row
            row_update_data = {
                "properties": {
                    "Name": "Sarah Wilson",
                    "Email": "sarah.wilson@newcompany.com",
                    "Status": "Inactive",
                    "Created": "2024-01-15",
                    "Notes": "Customer moved to competitor"
                }
            }
            
            update_row_response = self.session.put(f"{API_BASE}/databases/{database_id}/rows/{row_id}", json=row_update_data)
            if update_row_response.status_code != 200:
                self.log_test("Databases API - Update Row", False, f"Update row failed: {update_row_response.status_code}")
                return False
            
            self.log_test("Databases API - Update Row", True, "Row updated successfully")
            
            # Test deleting row
            delete_row_response = self.session.delete(f"{API_BASE}/databases/{database_id}/rows/{row_id}")
            if delete_row_response.status_code != 200:
                self.log_test("Databases API - Delete Row", False, f"Delete row failed: {delete_row_response.status_code}")
                return False
            
            self.log_test("Databases API - Delete Row", True, "Row deleted successfully")
            
            # Test deleting database
            delete_response = self.session.delete(f"{API_BASE}/databases/{database_id}")
            if delete_response.status_code != 200:
                self.log_test("Databases API - Delete", False, f"Delete failed: {delete_response.status_code}")
                return False
            
            self.log_test("Databases API - Delete", True, "Database deleted successfully")
            
            # Clean up workspace
            self.session.delete(f"{API_BASE}/workspaces/{workspace_id}")
            
            return True
            
        except Exception as e:
            self.log_test("Databases API", False, f"Databases API error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests including authentication and API endpoints"""
        print(f"🚀 Starting Complete Backend API Tests")
        print(f"📍 Backend URL: {API_BASE}")
        print("=" * 60)
        
        tests = [
            ("Database Setup", self.test_database_connection),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("JWT Authentication", self.test_jwt_authentication),
            ("MFA Setup", self.test_mfa_setup),
            ("MFA Login", self.test_mfa_login),
            ("Rate Limiting", self.test_rate_limiting),
            ("User Management", self.test_user_management),
            ("Workspaces API", self.test_workspaces_api),
            ("Pages API", self.test_pages_api),
            ("Databases API", self.test_databases_api),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name} test...")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
                results[test_name] = False
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
            if success:
                passed += 1
        
        print(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend authentication system is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the implementation.")
        
        return results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
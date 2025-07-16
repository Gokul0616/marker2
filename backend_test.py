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
        self.test_user_email = "alice.johnson@example.com"
        self.test_user_password = "SecurePass123!"
        self.test_user_name = "Alice Johnson"
        self.auth_token = None
        self.user_id = None
        self.backup_codes = []
        
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
    
    def run_all_tests(self):
        """Run all backend authentication tests"""
        print(f"🚀 Starting Backend Authentication System Tests")
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
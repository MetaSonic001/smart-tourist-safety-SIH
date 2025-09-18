# keycloak-test.py - Test Script for Keycloak Integration
# ============================================================================
#!/usr/bin/env python3
"""
Test script to verify Keycloak integration for Smart Tourist Safety
"""

import requests
import json
import sys
from typing import Dict, Any

class KeycloakTester:
    def __init__(self, base_url: str = "http://localhost:8080", realm: str = "sih"):
        self.base_url = base_url
        self.realm = realm
        self.token_endpoint = f"{self.base_url}/realms/{realm}/protocol/openid-connect/token"
        self.introspect_endpoint = f"{self.base_url}/realms/{realm}/protocol/openid-connect/token/introspect"
        self.userinfo_endpoint = f"{self.base_url}/realms/{realm}/protocol/openid-connect/userinfo"
    
    def test_user_login(self, username: str, password: str, client_id: str = "sih-nextjs") -> Dict[str, Any]:
        """Test user login with password grant"""
        print(f"\n🧪 Testing login for user: {username}")
        
        data = {
            "grant_type": "password",
            "client_id": client_id,
            "username": username,
            "password": password,
            "scope": "openid profile email"
        }
        
        try:
            response = requests.post(self.token_endpoint, data=data)
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"  ✅ Login successful")
                print(f"  🔑 Token type: {token_data.get('token_type')}")
                print(f"  ⏰ Expires in: {token_data.get('expires_in')} seconds")
                
                # Test token introspection
                self.test_token_introspection(token_data["access_token"], client_id)
                
                # Test userinfo endpoint
                self.test_userinfo(token_data["access_token"])
                
                return token_data
            else:
                print(f"  ❌ Login failed: {response.status_code}")
                print(f"  📄 Response: {response.text}")
                return {}
                
        except Exception as e:
            print(f"  ❌ Error during login: {e}")
            return {}
    
    def test_token_introspection(self, access_token: str, client_id: str):
        """Test token introspection"""
        print("  🔍 Testing token introspection...")
        
        data = {
            "token": access_token,
            "client_id": client_id
        }
        
        try:
            response = requests.post(self.introspect_endpoint, data=data)
            
            if response.status_code == 200:
                introspect_data = response.json()
                if introspect_data.get("active"):
                    print("    ✅ Token is active")
                    print(f"    👤 Username: {introspect_data.get('username')}")
                    print(f"    📧 Email: {introspect_data.get('email')}")
                    
                    # Check roles
                    realm_access = introspect_data.get('realm_access', {})
                    roles = realm_access.get('roles', [])
                    if roles:
                        print(f"    🎭 Roles: {', '.join(roles)}")
                    
                    # Check custom claims
                    if 'consent.sos' in introspect_data:
                        print(f"    🆘 SOS Consent: {introspect_data['consent.sos']}")
                    if 'consent.tracking' in introspect_data:
                        print(f"    📍 Tracking Consent: {introspect_data['consent.tracking']}")
                    if 'digital_id' in introspect_data:
                        print(f"    🆔 Digital ID: {introspect_data['digital_id']}")
                else:
                    print("    ❌ Token is not active")
            else:
                print(f"    ❌ Introspection failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Error during introspection: {e}")
    
    def test_userinfo(self, access_token: str):
        """Test userinfo endpoint"""
        print("  👤 Testing userinfo endpoint...")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = requests.get(self.userinfo_endpoint, headers=headers)
            
            if response.status_code == 200:
                userinfo = response.json()
                print("    ✅ Userinfo retrieved successfully")
                print(f"    📧 Email: {userinfo.get('email')}")
                print(f"    👤 Name: {userinfo.get('name')}")
                print(f"    🆔 Subject: {userinfo.get('sub')}")
            else:
                print(f"    ❌ Userinfo failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Error getting userinfo: {e}")
    
    def test_service_account_token(self, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Test service account (client credentials) flow"""
        print(f"\n🤖 Testing service account for: {client_id}")
        
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        try:
            response = requests.post(self.token_endpoint, data=data)
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"  ✅ Service account token obtained")
                print(f"  🔑 Token type: {token_data.get('token_type')}")
                print(f"  ⏰ Expires in: {token_data.get('expires_in')} seconds")
                
                # Test introspection for service account
                self.test_token_introspection(token_data["access_token"], client_id)
                
                return token_data
            else:
                print(f"  ❌ Service account failed: {response.status_code}")
                print(f"  📄 Response: {response.text}")
                return {}
                
        except Exception as e:
            print(f"  ❌ Error getting service account token: {e}")
            return {}
    
    def run_comprehensive_test(self):
        """Run comprehensive test suite"""
        print("🎯 Smart Tourist Safety - Keycloak Integration Test")
        print("=" * 60)
        
        # Test realm availability
        print("🏠 Testing realm availability...")
        try:
            response = requests.get(f"{self.base_url}/realms/{self.realm}")
            if response.status_code == 200:
                print("  ✅ SIH realm is accessible")
            else:
                print(f"  ❌ SIH realm not accessible: {response.status_code}")
                return False
        except Exception as e:
            print(f"  ❌ Error accessing realm: {e}")
            return False
        
        # Test user logins for each role
        test_users = [
            ("test-admin", "Password123!"),
            ("test-police", "Password123!"),
            ("test-tourism", "Password123!"),
            ("test-operator", "Password123!"),
            ("test-hotel", "Password123!"),
            ("test-tourist", "Password123!")
        ]
        
        successful_logins = 0
        
        for username, password in test_users:
            token_data = self.test_user_login(username, password)
            if token_data:
                successful_logins += 1
        
        print(f"\n📊 User Login Summary: {successful_logins}/{len(test_users)} successful")
        
        # Test service account (if secrets are available)
        try:
            with open("keycloak-client-secrets.env", "r") as f:
                secrets_content = f.read()
                
            if "AUTH_ONBOARDING_SERVICE_CLIENT_SECRET=" in secrets_content:
                # Extract client secret for testing
                for line in secrets_content.split('\n'):
                    if line.startswith("AUTH_ONBOARDING_SERVICE_CLIENT_SECRET="):
                        client_secret = line.split('=', 1)[1]
                        self.test_service_account_token("auth-onboarding-service", client_secret)
                        break
                        
        except FileNotFoundError:
            print("\n⚠️  Client secrets file not found. Run setup first to test service accounts.")
        
        print(f"\n{'='*60}")
        if successful_logins == len(test_users):
            print("🎉 All tests passed! Keycloak is properly configured.")
            return True
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            return False


def main():
    tester = KeycloakTester()
    
    # Check if Keycloak is running
    try:
        response = requests.get("http://localhost:8080", timeout=5)
        print("✅ Keycloak is running")
    except:
        print("❌ Keycloak is not running. Please start it first with:")
        print("   docker-compose -f docker-compose-keycloak.yml up -d")
        sys.exit(1)
    
    # Run tests
    if tester.run_comprehensive_test():
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check your configuration.")
        sys.exit(1)


if __name__ == "__main__":
    main()

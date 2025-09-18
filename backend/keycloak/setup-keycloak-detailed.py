#!/usr/bin/env python3
"""
Smart Tourist Safety - Keycloak Detailed Configuration Script
Configures roles, groups, clients, and users for the SIH system
"""

import requests
import json
import time
import sys
from typing import Dict, List, Optional

class KeycloakConfigurator:
    def __init__(self, base_url: str = "http://localhost:8080", realm: str = "sih"):
        self.base_url = base_url
        self.realm = realm
        self.admin_token = None
        self.admin_user = "admin"
        self.admin_password = "admin123"
        
    def authenticate(self) -> bool:
        """Authenticate and get admin token"""
        try:
            url = f"{self.base_url}/realms/master/protocol/openid-connect/token"
            data = {
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": self.admin_user,
                "password": self.admin_password
            }
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.admin_token = token_data["access_token"]
            print("✅ Successfully authenticated with Keycloak")
            return True
            
        except Exception as e:
            print(f"❌ Failed to authenticate: {e}")
            return False
    
    def create_sih_realm(self):
        """Create the SIH realm"""
        print("\n🏠 Creating SIH realm...")
        
        realm_config = {
            "realm": self.realm,
            "enabled": True,
            "displayName": "Smart Tourist Safety",
            "sslRequired": "none",
            "registrationAllowed": False,
            "passwordPolicy": "length(10) and digits(1) and lowerCase(1) and upperCase(1) and specialChars(1)",
            "bruteForceProtected": True,
            "maxFailureWaitSeconds": 900,
            "adminEventsEnabled": True,
            "eventsEnabled": True
        }
        
        url = f"{self.base_url}/admin/realms"
        
        try:
            response = requests.post(url, headers=self.get_headers(), json=realm_config)
            if response.status_code == 201:
                print(f"  ✅ Created SIH realm successfully")
            elif response.status_code == 409:
                print(f"  ℹ️  SIH realm already exists")
            else:
                print(f"  ⚠️  Failed to create SIH realm: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error creating SIH realm: {e}")    
    
    def get_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
    
    def create_realm_roles(self):
        """Create all realm roles"""
        print("\n🔧 Creating realm roles...")
        
        roles = [
            {"name": "admin", "description": "System Administrator"},
            {"name": "police", "description": "Police Personnel"},
            {"name": "tourism_officer", "description": "Tourism Department Officer"},
            {"name": "operator_112", "description": "Emergency Operator (112)"},
            {"name": "hotel_user", "description": "Hotel Staff"},
            {"name": "tourist", "description": "Tourist/End User"},
            {"name": "analytics_viewer", "description": "Analytics Read-Only User"},
            {"name": "auditor", "description": "System Auditor"},
            {"name": "service_account", "description": "Service Account Role"}
        ]
        
        url = f"{self.base_url}/admin/realms/{self.realm}/roles"
        
        for role in roles:
            try:
                response = requests.post(url, headers=self.get_headers(), json=role)
                if response.status_code == 201:
                    print(f"  ✅ Created role: {role['name']}")
                elif response.status_code == 409:
                    print(f"  ℹ️  Role already exists: {role['name']}")
                else:
                    print(f"  ⚠️  Failed to create role {role['name']}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Error creating role {role['name']}: {e}")
    
    def create_groups(self):
        """Create organizational groups"""
        print("\n🔧 Creating groups...")
        
        groups = [
            {"name": "police_dept_assam", "path": "/police_dept_assam"},
            {"name": "police_dept_kerala", "path": "/police_dept_kerala"},
            {"name": "tourism_dept_assam", "path": "/tourism_dept_assam"},
            {"name": "tourism_dept_kerala", "path": "/tourism_dept_kerala"},
            {"name": "hotels_chain_taj", "path": "/hotels_chain_taj"},
            {"name": "hotels_chain_oberoi", "path": "/hotels_chain_oberoi"},
            {"name": "operators_shift_a", "path": "/operators_shift_a"},
            {"name": "operators_shift_b", "path": "/operators_shift_b"},
            {"name": "system_admins", "path": "/system_admins"}
        ]
        
        url = f"{self.base_url}/admin/realms/{self.realm}/groups"
        
        for group in groups:
            try:
                response = requests.post(url, headers=self.get_headers(), json=group)
                if response.status_code == 201:
                    print(f"  ✅ Created group: {group['name']}")
                elif response.status_code == 409:
                    print(f"  ℹ️  Group already exists: {group['name']}")
            except Exception as e:
                print(f"  ❌ Error creating group {group['name']}: {e}")
    
    def assign_roles_to_groups(self):
        """Assign roles to groups"""
        print("\n🔧 Assigning roles to groups...")
        
        # Get all groups
        groups_url = f"{self.base_url}/admin/realms/{self.realm}/groups"
        groups_response = requests.get(groups_url, headers=self.get_headers())
        groups = groups_response.json()
        
        # Get all roles
        roles_url = f"{self.base_url}/admin/realms/{self.realm}/roles"
        roles_response = requests.get(roles_url, headers=self.get_headers())
        roles = roles_response.json()
        
        # Create role mapping
        role_mappings = {
            "police_dept_assam": ["police"],
            "police_dept_kerala": ["police"],
            "tourism_dept_assam": ["tourism_officer"],
            "tourism_dept_kerala": ["tourism_officer"],
            "hotels_chain_taj": ["hotel_user"],
            "hotels_chain_oberoi": ["hotel_user"],
            "operators_shift_a": ["operator_112"],
            "operators_shift_b": ["operator_112"],
            "system_admins": ["admin", "auditor"]
        }
        
        # Create role lookup
        role_lookup = {role["name"]: role for role in roles if isinstance(role, dict) and "name" in role}
        
        for group in groups:
            group_name = group["name"]
            if group_name in role_mappings:
                group_id = group["id"]
                roles_to_assign = []
                
                for role_name in role_mappings[group_name]:
                    if role_name in role_lookup:
                        roles_to_assign.append({
                            "id": role_lookup[role_name]["id"],
                            "name": role_lookup[role_name]["name"]
                        })
                
                if roles_to_assign:
                    assign_url = f"{self.base_url}/admin/realms/{self.realm}/groups/{group_id}/role-mappings/realm"
                    try:
                        response = requests.post(assign_url, headers=self.get_headers(), json=roles_to_assign)
                        if response.status_code == 204:
                            print(f"  ✅ Assigned roles to group: {group_name}")
                        else:
                            print(f"  ⚠️  Failed to assign roles to group {group_name}: {response.status_code}")
                    except Exception as e:
                        print(f"  ❌ Error assigning roles to group {group_name}: {e}")
    
    def create_clients(self):
        """Create OAuth2 clients for frontend and backend services"""
        print("\n🔧 Creating OAuth2 clients...")
        
        clients = [
            # Frontend clients
            {
                "clientId": "sih-nextjs",
                "name": "SIH Next.js Frontend",
                "description": "Main dashboard and website",
                "enabled": True,
                "publicClient": True,
                "standardFlowEnabled": True,
                "directAccessGrantsEnabled": True,
                "redirectUris": [
                    "http://localhost:3000/*",
                    "https://*.vercel.app/*",
                    "https://sih-dashboard.com/*"
                ],
                "webOrigins": ["+"],
                "attributes": {
                    "pkce.code.challenge.method": "S256"
                }
            },
            {
                "clientId": "sih-mobile-app",
                "name": "SIH Mobile App",
                "description": "Tourist mobile application",
                "enabled": True,
                "publicClient": True,
                "standardFlowEnabled": True,
                "directAccessGrantsEnabled": True,
                "redirectUris": [
                    "com.sih.tourist://auth/*",
                    "http://localhost:19006/*"
                ]
            },
            {
                "clientId": "sih-operator-ui",
                "name": "SIH Operator Console",
                "description": "112 Operator console interface",
                "enabled": True,
                "publicClient": False,
                "standardFlowEnabled": True,
                "directAccessGrantsEnabled": True,
                "redirectUris": ["http://localhost:3001/*"],
                "webOrigins": ["+"]
            },
            
            # Backend service clients
            {
                "clientId": "auth-onboarding-service",
                "name": "Auth & Onboarding Service",
                "description": "Authentication and tourist onboarding",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "blockchain-service",
                "name": "Blockchain Service",
                "description": "Blockchain integration service",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "tourist-profile-service",
                "name": "Tourist Profile Service",
                "description": "Tourist data and profile management",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "ml-service",
                "name": "ML Service",
                "description": "Machine learning and risk assessment",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "alerts-service",
                "name": "Alerts & Incident Service",
                "description": "Alert handling and incident management",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "dashboard-aggregator",
                "name": "Dashboard Aggregator",
                "description": "Dashboard data aggregation service",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "operator-service",
                "name": "Operator Service",
                "description": "112 operator management service",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            },
            {
                "clientId": "notification-adaptor",
                "name": "Notification Adaptor",
                "description": "Push notifications and SMS service",
                "enabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False,
                "standardFlowEnabled": False,
                "directAccessGrantsEnabled": False
            }
        ]
        
        url = f"{self.base_url}/admin/realms/{self.realm}/clients"
        
        for client in clients:
            try:
                response = requests.post(url, headers=self.get_headers(), json=client)
                if response.status_code == 201:
                    print(f"  ✅ Created client: {client['clientId']}")
                elif response.status_code == 409:
                    print(f"  ℹ️  Client already exists: {client['clientId']}")
                else:
                    print(f"  ⚠️  Failed to create client {client['clientId']}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Error creating client {client['clientId']}: {e}")
    
    def create_client_scopes_and_mappers(self):
        """Create client scopes and protocol mappers"""
        print("\n🔧 Creating client scopes and mappers...")
        
        # Create SIH scope
        scope = {
            "name": "sih_scope",
            "description": "Smart Tourist Safety System Scope",
            "protocol": "openid-connect",
            "attributes": {
                "include.in.token.scope": "true",
                "display.on.consent.screen": "true"
            }
        }
        
        scopes_url = f"{self.base_url}/admin/realms/{self.realm}/client-scopes"
        
        try:
            response = requests.post(scopes_url, headers=self.get_headers(), json=scope)
            if response.status_code == 201:
                print("  ✅ Created SIH client scope")
                
                # Get the created scope ID
                get_response = requests.get(scopes_url, headers=self.get_headers())
                scopes = get_response.json()
                sih_scope_id = None
                
                for s in scopes:
                    if s["name"] == "sih_scope":
                        sih_scope_id = s["id"]
                        break
                
                if sih_scope_id:
                    self.create_protocol_mappers(sih_scope_id)
                    
            elif response.status_code == 409:
                print("  ℹ️  SIH client scope already exists")
        except Exception as e:
            print(f"  ❌ Error creating client scope: {e}")
    
    def create_protocol_mappers(self, scope_id: str):
        """Create protocol mappers for the SIH scope"""
        mappers = [
            {
                "name": "org-mapper",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-group-membership-mapper",
                "config": {
                    "claim.name": "org",
                    "jsonType.label": "String",
                    "id.token.claim": "true",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "true"
                }
            },
            {
                "name": "digital-id-mapper",
                "protocol": "openid-connect", 
                "protocolMapper": "oidc-usermodel-attribute-mapper",
                "config": {
                    "user.attribute": "digital_id",
                    "claim.name": "digital_id",
                    "jsonType.label": "String",
                    "id.token.claim": "false",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "false"
                }
            },
            {
                "name": "consent-sos-mapper",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-usermodel-attribute-mapper",
                "config": {
                    "user.attribute": "consent_sos",
                    "claim.name": "consent.sos",
                    "jsonType.label": "Boolean",
                    "id.token.claim": "false",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "false"
                }
            },
            {
                "name": "consent-tracking-mapper",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-usermodel-attribute-mapper",
                "config": {
                    "user.attribute": "consent_tracking",
                    "claim.name": "consent.tracking",
                    "jsonType.label": "Boolean",
                    "id.token.claim": "false",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "false"
                }
            }
        ]
        
        mappers_url = f"{self.base_url}/admin/realms/{self.realm}/client-scopes/{scope_id}/protocol-mappers/models"
        
        for mapper in mappers:
            try:
                response = requests.post(mappers_url, headers=self.get_headers(), json=mapper)
                if response.status_code == 201:
                    print(f"    ✅ Created mapper: {mapper['name']}")
                elif response.status_code == 409:
                    print(f"    ℹ️  Mapper already exists: {mapper['name']}")
            except Exception as e:
                print(f"    ❌ Error creating mapper {mapper['name']}: {e}")
    
    def create_test_users(self):
        """Create test users for development"""
        print("\n🔧 Creating test users...")
        
        users = [
            {
                "username": "test-admin",
                "firstName": "Test",
                "lastName": "Admin",
                "email": "admin@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "groups": ["/system_admins"],
                "attributes": {
                    "consent_sos": ["true"],
                    "consent_tracking": ["true"]
                }
            },
            {
                "username": "test-police",
                "firstName": "Test",
                "lastName": "Police",
                "email": "police@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "groups": ["/police_dept_assam"]
            },
            {
                "username": "test-tourism",
                "firstName": "Test",
                "lastName": "Tourism",
                "email": "tourism@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "groups": ["/tourism_dept_assam"]
            },
            {
                "username": "test-operator",
                "firstName": "Test",
                "lastName": "Operator",
                "email": "operator@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "groups": ["/operators_shift_a"]
            },
            {
                "username": "test-hotel",
                "firstName": "Test",
                "lastName": "Hotel",
                "email": "hotel@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "groups": ["/hotels_chain_taj"]
            },
            {
                "username": "test-tourist",
                "firstName": "Test",
                "lastName": "Tourist",
                "email": "tourist@sih-test.com",
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": "Password123!",
                    "temporary": False
                }],
                "attributes": {
                    "digital_id": ["550e8400-e29b-41d4-a716-446655440000"],
                    "consent_sos": ["true"],
                    "consent_tracking": ["false"]
                }
            }
        ]
        
        users_url = f"{self.base_url}/admin/realms/{self.realm}/users"
        
        for user in users:
            try:
                response = requests.post(users_url, headers=self.get_headers(), json=user)
                if response.status_code == 201:
                    print(f"  ✅ Created user: {user['username']}")
                elif response.status_code == 409:
                    print(f"  ℹ️  User already exists: {user['username']}")
                else:
                    print(f"  ⚠️  Failed to create user {user['username']}: {response.status_code}")
                    print(f"      Response: {response.text}")
            except Exception as e:
                print(f"  ❌ Error creating user {user['username']}: {e}")
    
    def configure_service_account_roles(self):
        """Configure service account roles for backend clients"""
        print("\n🔧 Configuring service account roles...")
        
        # Get all clients
        clients_url = f"{self.base_url}/admin/realms/{self.realm}/clients"
        clients_response = requests.get(clients_url, headers=self.get_headers())
        clients = clients_response.json()
        
        # Get all roles
        roles_url = f"{self.base_url}/admin/realms/{self.realm}/roles"
        roles_response = requests.get(roles_url, headers=self.get_headers())
        roles = roles_response.json()
        
        service_clients = [
            "auth-onboarding-service",
            "blockchain-service", 
            "tourist-profile-service",
            "ml-service",
            "alerts-service",
            "dashboard-aggregator",
            "operator-service",
            "notification-adaptor"
        ]
        
        # Create role lookup
        role_lookup = {role["name"]: role for role in roles}
        
        for client in clients:
            if client["clientId"] in service_clients:
                client_id = client["id"]
                service_account_user_url = f"{self.base_url}/admin/realms/{self.realm}/clients/{client_id}/service-account-user"
                
                try:
                    sa_response = requests.get(service_account_user_url, headers=self.get_headers())
                    if sa_response.status_code == 200:
                        sa_user = sa_response.json()
                        sa_user_id = sa_user["id"]
                        
                        # Assign service_account role
                        if "service_account" in role_lookup:
                            role_mapping_url = f"{self.base_url}/admin/realms/{self.realm}/users/{sa_user_id}/role-mappings/realm"
                            role_to_assign = [{
                                "id": role_lookup["service_account"]["id"],
                                "name": "service_account"
                            }]
                            
                            assign_response = requests.post(role_mapping_url, headers=self.get_headers(), json=role_to_assign)
                            if assign_response.status_code == 204:
                                print(f"  ✅ Assigned service_account role to: {client['clientId']}")
                            else:
                                print(f"  ⚠️  Failed to assign role to {client['clientId']}: {assign_response.status_code}")
                
                except Exception as e:
                    print(f"  ❌ Error configuring service account for {client['clientId']}: {e}")
    
    def get_client_secrets(self):
        """Get and display client secrets for backend services"""
        print("\n🔐 Client Secrets (save these for your .env files):")
        print("="*60)
        
        # Get all clients
        clients_url = f"{self.base_url}/admin/realms/{self.realm}/clients"
        clients_response = requests.get(clients_url, headers=self.get_headers())
        clients = clients_response.json()
        
        confidential_clients = [
            "auth-onboarding-service",
            "blockchain-service",
            "tourist-profile-service", 
            "ml-service",
            "alerts-service",
            "dashboard-aggregator",
            "operator-service",
            "notification-adaptor"
        ]
        
        secrets = {}
        
        for client in clients:
            if client["clientId"] in confidential_clients:
                client_id = client["id"]
                secret_url = f"{self.base_url}/admin/realms/{self.realm}/clients/{client_id}/client-secret"
                
                try:
                    secret_response = requests.get(secret_url, headers=self.get_headers())
                    if secret_response.status_code == 200:
                        secret_data = secret_response.json()
                        secrets[client["clientId"]] = secret_data["value"]
                        print(f"{client['clientId'].upper().replace('-', '_')}_CLIENT_SECRET={secret_data['value']}")
                except Exception as e:
                    print(f"  ❌ Error getting secret for {client['clientId']}: {e}")
        
        print("="*60)
        
        # Save to file for easy sharing
        with open("keycloak-client-secrets.env", "w") as f:
            f.write("# Keycloak Client Secrets for Smart Tourist Safety\n")
            f.write("# Generated automatically - keep secure!\n\n")
            f.write("# Keycloak Configuration\n")
            f.write("USE_KEYCLOAK=true\n")
            f.write("KEYCLOAK_SERVER_URL=http://localhost:8080\n")
            f.write("KEYCLOAK_REALM=sih\n\n")
            f.write("# Client Secrets\n")
            for client_id, secret in secrets.items():
                env_var = f"{client_id.upper().replace('-', '_')}_CLIENT_SECRET"
                f.write(f"{env_var}={secret}\n")
        
        print("💾 Secrets saved to: keycloak-client-secrets.env")
        return secrets
    
    def test_token_endpoint(self):
        """Test token endpoint with test user"""
        print("\n🧪 Testing token endpoint...")
        
        token_url = f"{self.base_url}/realms/{self.realm}/protocol/openid-connect/token"
        data = {
            "grant_type": "password",
            "client_id": "sih-nextjs",
            "username": "test-tourist",
            "password": "Password123!",
            "scope": "openid profile email"
        }
        
        try:
            response = requests.post(token_url, data=data)
            if response.status_code == 200:
                token_data = response.json()
                print("  ✅ Token endpoint working")
                print(f"  🔑 Access token received (expires in {token_data.get('expires_in', 'unknown')} seconds)")
                
                # Test token introspection
                introspect_url = f"{self.base_url}/realms/{self.realm}/protocol/openid-connect/token/introspect"
                introspect_data = {
                    "token": token_data["access_token"],
                    "client_id": "sih-nextjs"
                }
                
                introspect_response = requests.post(introspect_url, data=introspect_data)
                if introspect_response.status_code == 200:
                    introspect_result = introspect_response.json()
                    if introspect_result.get("active"):
                        print("  ✅ Token introspection working")
                        print(f"  👤 Token belongs to: {introspect_result.get('username', 'unknown')}")
                        print(f"  🎭 Roles: {introspect_result.get('realm_access', {}).get('roles', [])}")
                    else:
                        print("  ⚠️  Token not active")
                else:
                    print(f"  ⚠️  Token introspection failed: {introspect_response.status_code}")
                
            else:
                print(f"  ❌ Token endpoint failed: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            print(f"  ❌ Error testing token endpoint: {e}")
    
    def run_complete_setup(self):
        """Run complete Keycloak setup"""
        print("🚀 Starting complete Keycloak setup...")
        
        if not self.authenticate():
            return False
        
        # Add this line:
        self.create_sih_realm()
        time.sleep(2)  # Wait for realm to be ready
        self.create_realm_roles()
        self.create_groups()
        self.assign_roles_to_groups()
        self.create_clients()
        self.create_client_scopes_and_mappers()
        self.configure_service_account_roles()
        self.create_test_users()
        
        print("\n" + "="*60)
        print("📋 SETUP SUMMARY")
        print("="*60)
        
        secrets = self.get_client_secrets()
        self.test_token_endpoint()
        
        print("\n✅ Keycloak setup completed successfully!")
        print(f"\n📍 Access URLs:")
        print(f"   Admin Console: {self.base_url}/admin/")
        print(f"   SIH Realm: {self.base_url}/realms/{self.realm}")
        print(f"   Token Endpoint: {self.base_url}/realms/{self.realm}/protocol/openid-connect/token")
        
        print(f"\n👥 Test Users (all with password 'Password123!'):")
        test_users = ["test-admin", "test-police", "test-tourism", "test-operator", "test-hotel", "test-tourist"]
        for user in test_users:
            print(f"   {user}")
        
        return True


def main():
    print("🎯 Smart Tourist Safety - Keycloak Configuration")
    print("="*50)
    
    configurator = KeycloakConfigurator()
    
    # Wait for Keycloak to be ready
    print("⏳ Waiting for Keycloak to be ready...")
    for attempt in range(30):
        try:
            response = requests.get(f"{configurator.base_url}/realms/master", timeout=5)
            if response.status_code == 200:
                print("✅ Keycloak is ready!")
                break
        except:
            pass
        
        time.sleep(2)
        print(f"   Attempt {attempt + 1}/30...")
    else:
        print("❌ Keycloak is not responding. Please check if it's running.")
        sys.exit(1)
    
    # Run setup
    if configurator.run_complete_setup():
        print("\n🎉 Setup completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Update your microservices with the client secrets from keycloak-client-secrets.env")
        print("   2. Test authentication with the test users")
        print("   3. Customize roles and permissions as needed")
    else:
        print("❌ Setup failed. Check the output above for errors.")
        sys.exit(1)


if __name__ == "__main__":
    main()

# ============================================================================
# README-Keycloak.md - Setup Instructions
# ============================================================================
# Smart Tourist Safety - Keycloak Setup Guide

This directory contains automated scripts to set up Keycloak with complete RBAC configuration for the Smart Tourist Safety Monitoring system.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Python 3.7+ installed
- PowerShell or Command Prompt access

### Automated Setup (Recommended)

1. **Download all files** to a folder (e.g., `keycloak-setup/`)

2. **Run the complete setup**:
   ```cmd
   setup-complete.bat
   ```

   This will:
   - Stop any existing Keycloak containers
   - Start fresh Keycloak with PostgreSQL
   - Configure realm, roles, clients, and users
   - Generate client secrets
   - Run integration tests

3. **Access Keycloak**:
   - Admin Console: http://localhost:8080/admin/
   - Username: `admin`
   - Password: `admin123`

### Manual Step-by-Step Setup

If you prefer manual control:

1. **Start infrastructure**:
   ```cmd
   docker-compose -f docker-compose-keycloak.yml up -d
   ```

2. **Wait for startup** (2-3 minutes), then run configuration:
   ```cmd
   python setup-keycloak-detailed.py
   ```

3. **Test the setup**:
   ```cmd
   python keycloak-test.py
   ```

## 📋 What Gets Created

### Realm: `sih`
- Security policies enforced
- Brute force protection enabled
- Admin events logging enabled

### Roles
- `admin` - System Administrator
- `police` - Police Personnel  
- `tourism_officer` - Tourism Department
- `operator_112` - Emergency Operators
- `hotel_user` - Hotel Staff
- `tourist` - End Users
- `analytics_viewer` - Read-only Analytics
- `auditor` - System Auditor
- `service_account` - For backend services

### Groups (Organization-based)
- `police_dept_assam`, `police_dept_kerala`
- `tourism_dept_assam`, `tourism_dept_kerala`
- `hotels_chain_taj`, `hotels_chain_oberoi`
- `operators_shift_a`, `operators_shift_b`
- `system_admins`

### Clients
**Frontend clients:**
- `sih-nextjs` - Main dashboard (public)
- `sih-mobile-app` - Tourist app (public)
- `sih-operator-ui` - Operator console

**Backend service clients:**
- `auth-onboarding-service`
- `blockchain-service`
- `tourist-profile-service`
- `ml-service`
- `alerts-service`
- `dashboard-aggregator`
- `operator-service`
- `notification-adaptor`

### Test Users
All with password `Password123!`:
- `test-admin` - System admin
- `test-police` - Police user
- `test-tourism` - Tourism officer
- `test-operator` - 112 operator
- `test-hotel` - Hotel staff
- `test-tourist` - Tourist with consent flags

### Token Claims
Custom claims included in tokens:
- `org` - User's organization
- `digital_id` - Tourist's digital ID (if applicable)
- `consent.sos` - SOS consent flag
- `consent.tracking` - Location tracking consent

## 🔐 Client Secrets

After setup, client secrets are saved to `keycloak-client-secrets.env`:

```env
USE_KEYCLOAK=true
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=sih

AUTH_ONBOARDING_SERVICE_CLIENT_SECRET=xxx-xxx-xxx
BLOCKCHAIN_SERVICE_CLIENT_SECRET=xxx-xxx-xxx
# ... more secrets
```

**⚠️ Keep this file secure and share only with your development team!**

## 🧪 Testing

### Automated Testing
```cmd
python keycloak-test.py
```

### Manual Testing
1. **Test token endpoint**:
   ```bash
   curl -X POST http://localhost:8080/realms/sih/protocol/openid-connect/token \
     -d "grant_type=password" \
     -d "client_id=sih-nextjs" \
     -d "username=test-tourist" \
     -d "password=Password123!" \
     -d "scope=openid profile email"
   ```

2. **Test service account**:
   ```bash
   curl -X POST http://localhost:8080/realms/sih/protocol/openid-connect/token \
     -d "grant_type=client_credentials" \
     -d "client_id=auth-onboarding-service" \
     -d "client_secret=YOUR_CLIENT_SECRET"
   ```

## 🔧 Integration with FastAPI Services

Update your FastAPI services with these environment variables:

```env
USE_KEYCLOAK=true
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=sih
KEYCLOAK_CLIENT_ID=your-service-name
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

Example FastAPI integration:
```python
from fastapi import Depends
from fastapi_keycloak import FastAPIKeycloak

idp = FastAPIKeycloak(
    server_url="http://localhost:8080",
    client_id="your-service",
    client_secret="your-secret",
    realm="sih"
)

@app.get("/protected")
def protected_route(user: dict = Depends(idp.get_current_user())):
    return {"message": f"Hello {user['preferred_username']}!"}
```

## 📊 Role-Permission Matrix

| Role | View Tourist Data | Access PII | Create Incidents | Blockchain Ops | Audit Access |
|------|------------------|------------|------------------|----------------|--------------|
| admin | ✅ | ✅ (auto) | ✅ | ✅ | ✅ |
| police | ✅ | ✅ (supervised) | ✅ | ✅ (via service) | ✅ (limited) |
| tourism_officer | ✅ | ⚠️ (supervised) | ⚠️ (low priority) | ⚠️ | ⚠️ |
| operator_112 | ✅ | ⚠️ (active calls) | ✅ (dispatch) | ❌ | ✅ (call logs) |
| hotel_user | ⚠️ (guests only) | ❌ | ❌ | ❌ | ❌ |
| tourist | ✅ (own data) | ✅ (consent mgmt) | ✅ (SOS only) | ❌ | ❌ |

## 🛠️ Troubleshooting

### Keycloak Won't Start
```cmd
# Check Docker status
docker ps

# Check logs
docker logs keycloak-sih

# Restart services
docker-compose -f docker-compose-keycloak.yml restart
```

### Python Script Errors
```cmd
# Install required packages
pip install requests

# Check Python version
python --version
```

### Port Conflicts
If port 8080 is in use:
1. Stop the conflicting service
2. Or modify `docker-compose-keycloak.yml` to use different ports

### Reset Everything
```cmd
# Nuclear option - removes all data
docker-compose -f docker-compose-keycloak.yml down -v
docker volume prune -f
```

## 🔄 Sharing with Team

To share this setup with your team:

1. **Package the setup**:
   ```cmd
   # Create a zip with all files
   # Share: setup-complete.bat, docker-compose-keycloak.yml, 
   #        setup-keycloak-detailed.py, keycloak-test.py
   ```

2. **Team member setup**:
   ```cmd
   # Extract files
   # Run: setup-complete.bat
   # Get: keycloak-client-secrets.env
   ```
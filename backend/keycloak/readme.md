# ============================================================================
# team-setup-guide-cross-platform.md - Setup Guide for All Platforms
# ============================================================================
# Smart Tourist Safety - Cross-Platform Keycloak Setup

## 🎯 Platform-Specific Quick Start

### 🪟 **Windows Users**
```cmd
# Download all files to a folder
# Run the complete setup
setup-complete.bat

# Daily usage
daily-usage.bat
```

### 🍎 **Mac Users**
```bash
# Download all files to a folder
# Make scripts executable
chmod +x *.sh

# Run the complete setup
./setup-complete.sh

# Daily usage
./daily-usage.sh
```

### 🐧 **Linux Users**
```bash
# Download all files to a folder
# Make scripts executable
chmod +x *.sh

# Check prerequisites (optional)
./install-requirements.sh

# Run the complete setup
./setup-complete.sh

# Daily usage
./daily-usage.sh
```

## 📦 Prerequisites by Platform

### 🪟 **Windows**
- ✅ Docker Desktop
- ✅ Python 3.7+
- ✅ PowerShell/Command Prompt

### 🍎 **Mac**
- ✅ Docker Desktop
- ✅ Python 3.7+ (usually pre-installed)
- ✅ Terminal

**Install missing items:**
```bash
# Install Docker Desktop
# Download from: https://docs.docker.com/desktop/install/mac-install/

# Install Python (if needed)
brew install python3

# Or install everything at once
brew install --cask docker
brew install python3
```

### 🐧 **Linux**
- ✅ Docker + Docker Compose
- ✅ Python 3.7+
- ✅ Terminal

**Install missing items:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose python3 python3-pip curl

# CentOS/RHEL
sudo yum install docker docker-compose python3 python3-pip curl
sudo systemctl start docker
sudo systemctl enable docker

# Arch Linux
sudo pacman -S docker docker-compose python python-pip curl
sudo systemctl start docker
sudo systemctl enable docker
```

## 🚀 Universal Commands

### **Using Make (all platforms with make installed)**
```bash
make help          # Show all commands
make install-prereqs  # Check prerequisites  
make setup          # Complete setup
make start          # Start Keycloak
make stop           # Stop Keycloak
make status         # Check status
make daily          # Daily usage menu
```

### **Direct Docker Commands (all platforms)**
```bash
# Start
docker-compose -f docker-compose-keycloak.yml up -d

# Stop  
docker-compose -f docker-compose-keycloak.yml stop

# Status
docker ps | grep keycloak

# Logs
docker logs keycloak-sih --tail 50
```

## 📁 Complete File List for Team Sharing

### **📤 Files to Share with Team:**

**Core Setup Files (all platforms need these):**
- `docker-compose-keycloak.yml` - Docker configuration
- `setup-keycloak-detailed.py` - Python configuration script
- `keycloak-test.py` - Integration tests

**Windows Files:**
- `setup-complete.bat` - Windows setup
- `daily-usage.bat` - Windows daily operations
- `docker-status-check.bat` - Windows status check

**Mac/Linux Files:**  
- `setup-complete.sh` - Mac/Linux setup
- `daily-usage.sh` - Mac/Linux daily operations
- `docker-status-check.sh` - Mac/Linux status check
- `install-requirements.sh` - Prerequisites checker
- `Makefile` - Make commands

**Documentation:**
- `team-setup-guide-cross-platform.md` - This guide

### **📦 How to Package for Team:**

**Option 1: Create ZIP file**
```bash
# Include all files in a ZIP
# Name it: keycloak-setup-v1.0.zip
```

**Option 2: Git Repository**
```bash
# Create a team repository
git init
git add .
git commit -m "Initial Keycloak setup for SIH project"
```

**Option 3: Cloud Sharing**
```bash
# Upload to Google Drive/Dropbox/OneDrive
# Share folder link with team
```

## 👥 Team Member Instructions

### **🆕 New Team Member Setup:**

1. **Get the files** from team lead
2. **Choose your platform** and follow the quick start above
3. **Wait for completion** (3-5 minutes)
4. **Get client secrets** from team lead (`keycloak-client-secrets.env`)
5. **Test the setup** with provided test users

### **📋 Daily Workflow (All Platforms):**

**Morning:**
```bash
# Windows
daily-usage.bat → Option 1

# Mac/Linux  
./daily-usage.sh → Option 1

# Or direct command
docker-compose -f docker-compose-keycloak.yml up -d
```

**Evening:**
```bash
# Windows
daily-usage.bat → Option 2  

# Mac/Linux
./daily-usage.sh → Option 2

# Or direct command
docker-compose -f docker-compose-keycloak.yml stop
```

## 🧪 Testing on All Platforms

### **Python Test Script (universal):**
```bash
# Windows
python keycloak-test.py

# Mac/Linux
python3 keycloak-test.py
```

### **cURL Test (universal):**
```bash
curl -X POST http://localhost:8080/realms/sih/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=sih-nextjs" \
  -d "username=test-tourist" \
  -d "password=Password123!"
```

### **Browser Test (universal):**
- Open: http://localhost:8080/admin/
- Login: admin / admin123
- Switch to "sih" realm (top-left dropdown)

## 🛠️ Troubleshooting by Platform

### **🪟 Windows Issues:**

**Docker not running:**
```cmd
# Start Docker Desktop from Start Menu
# Wait for Docker icon in system tray to be green
```


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


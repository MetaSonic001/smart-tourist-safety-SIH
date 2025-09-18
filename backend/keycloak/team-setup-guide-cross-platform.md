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
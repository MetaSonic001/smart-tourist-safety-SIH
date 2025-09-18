# ============================================================================
# install-requirements.sh - Install Prerequisites (Mac/Linux)
# ============================================================================
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo
echo "====================================================="
echo "   Smart Tourist Safety - Prerequisites Installer"
echo "====================================================="
echo

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    OS="Unknown"
fi

echo -e "${BLUE}Detected OS: ${OS}${NC}"
echo

# Check Docker
echo -e "${BLUE}Checking Docker...${NC}"
if command -v docker >/dev/null 2>&1; then
    if docker version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker is installed and running${NC}"
        docker --version
    else
        echo -e "${YELLOW}⚠️  Docker is installed but not running${NC}"
        echo "Please start Docker and try again"
        
        if [[ "$OS" == "macOS" ]]; then
            echo "Start Docker Desktop from Applications"
        else
            echo "Run: sudo systemctl start docker"
        fi
    fi
else
    echo -e "${RED}❌ Docker is not installed${NC}"
    
    if [[ "$OS" == "macOS" ]]; then
        echo "Install Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
        echo "Or with Homebrew: brew install --cask docker"
    elif [[ "$OS" == "Linux" ]]; then
        echo "Install Docker:"
        echo "Ubuntu/Debian: sudo apt-get install docker.io docker-compose"
        echo "CentOS/RHEL: sudo yum install docker docker-compose"
        echo "Arch: sudo pacman -S docker docker-compose"
    fi
fi

# Check Docker Compose
echo
echo -e "${BLUE}Checking Docker Compose...${NC}"
if command -v docker-compose >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
    docker-compose --version
elif docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose (v2) is installed${NC}"
    docker compose version
else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    
    if [[ "$OS" == "macOS" ]]; then
        echo "Docker Compose should come with Docker Desktop"
        echo "Or install with: brew install docker-compose"
    elif [[ "$OS" == "Linux" ]]; then
        echo "Install Docker Compose:"
        echo "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "sudo chmod +x /usr/local/bin/docker-compose"
    fi
fi

# Check Python
echo
echo -e "${BLUE}Checking Python...${NC}"
if command -v python3 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Python 3 is installed${NC}"
    python3 --version
    
    # Check if requests module is available
    if python3 -c "import requests" 2>/dev/null; then
        echo -e "${GREEN}✅ Python requests module is available${NC}"
    else
        echo -e "${YELLOW}⚠️  Python requests module is missing${NC}"
        echo "Install with: pip3 install requests"
    fi
elif command -v python >/dev/null 2>&1; then
    python_version=$(python --version 2>&1)
    if [[ $python_version == *"3."* ]]; then
        echo -e "${GREEN}✅ Python 3 is installed${NC}"
        python --version
    else
        echo -e "${YELLOW}⚠️  Only Python 2 found, Python 3 recommended${NC}"
        python --version
    fi
else
    echo -e "${RED}❌ Python is not installed${NC}"
    
    if [[ "$OS" == "macOS" ]]; then
        echo "Install Python:"
        echo "1. From python.org: https://www.python.org/downloads/"
        echo "2. With Homebrew: brew install python3"
        echo "3. With pyenv: curl https://pyenv.run | bash"
    elif [[ "$OS" == "Linux" ]]; then
        echo "Install Python:"
        echo "Ubuntu/Debian: sudo apt-get install python3 python3-pip"
        echo "CentOS/RHEL: sudo yum install python3 python3-pip"
        echo "Arch: sudo pacman -S python python-pip"
    fi
fi

# Check curl
echo
echo -e "${BLUE}Checking curl...${NC}"
if command -v curl >/dev/null 2>&1; then
    echo -e "${GREEN}✅ curl is installed${NC}"
else
    echo -e "${YELLOW}⚠️  curl is not installed (recommended for testing)${NC}"
    
    if [[ "$OS" == "macOS" ]]; then
        echo "curl should be pre-installed on macOS"
        echo "If missing, install with: brew install curl"
    elif [[ "$OS" == "Linux" ]]; then
        echo "Install curl:"
        echo "Ubuntu/Debian: sudo apt-get install curl"
        echo "CentOS/RHEL: sudo yum install curl"
        echo "Arch: sudo pacman -S curl"
    fi
fi

# Summary
echo
echo "====================================================="
echo "   📋 PREREQUISITES SUMMARY"
echo "====================================================="

all_good=true

if ! command -v docker >/dev/null 2>&1 || ! docker version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker: Missing or not running${NC}"
    all_good=false
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose: Missing${NC}"
    all_good=false
fi

if ! command -v python3 >/dev/null 2>&1 && ! (command -v python >/dev/null 2>&1 && python --version 2>&1 | grep -q "3\."); then
    echo -e "${RED}❌ Python 3: Missing${NC}"
    all_good=false
fi

if $all_good; then
    echo -e "${GREEN}🎉 All prerequisites are satisfied!${NC}"
    echo
    echo -e "${GREEN}You can now run:${NC}"
    echo "  ./setup-complete.sh    - Complete Keycloak setup"
    echo "  ./daily-usage.sh       - Daily start/stop operations"
else
    echo -e "${YELLOW}⚠️  Please install missing prerequisites before continuing${NC}"
fi

echo

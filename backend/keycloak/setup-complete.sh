# ============================================================================
# setup-complete.sh - Cross-Platform Setup Script (Mac/Linux)
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
echo "   Smart Tourist Safety - Keycloak Setup"
echo "====================================================="
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running or not installed${NC}"
    echo "Please start Docker and try again"
    echo
    echo "Mac: Start Docker Desktop"
    echo "Linux: sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}[INFO] Docker is running...${NC}"

# Get user confirmation
echo "This script will:"
echo "1. Stop any existing Keycloak containers"
echo "2. Start fresh Keycloak with PostgreSQL"
echo "3. Configure realm, roles, clients, and users"
echo "4. Generate client secrets for your services"
echo
read -p "Continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo
echo -e "${BLUE}[STEP 1] Cleaning up existing containers...${NC}"
docker-compose -f docker-compose-keycloak.yml down -v 2>/dev/null || true
docker container stop keycloak-sih postgres-keycloak 2>/dev/null || true
docker container rm keycloak-sih postgres-keycloak 2>/dev/null || true
docker volume rm keycloak_postgres_data keycloak_data 2>/dev/null || true

echo -e "${BLUE}[STEP 2] Starting Keycloak infrastructure...${NC}"
docker-compose -f docker-compose-keycloak.yml up -d

echo -e "${BLUE}[STEP 3] Waiting for services to be ready...${NC}"
echo "This may take 2-3 minutes on first startup..."

# Wait for Keycloak health check
echo "Waiting for Keycloak to become healthy..."
for i in {1..60}; do
    if docker exec keycloak-sih curl -f http://localhost:8080/health >/dev/null 2>&1; then
        echo -e "${GREEN}[SUCCESS] Keycloak is ready!${NC}"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}[WARNING] Keycloak might still be starting. You can check with:${NC}"
        echo "docker logs keycloak-sih"
        break
    fi
    
    echo "Still waiting... (${i}/60)"
    sleep 10
done

echo -e "${BLUE}[STEP 4] Running configuration script...${NC}"

# Check if Python is available
if command -v python3 >/dev/null 2>&1; then
    python3 setup-keycloak-detailed.py
elif command -v python >/dev/null 2>&1; then
    python setup-keycloak-detailed.py
else
    echo -e "${YELLOW}[WARNING] Python not found. Please install Python 3.7+ and run:${NC}"
    echo "python3 setup-keycloak-detailed.py"
    echo
    echo "Or configure Keycloak manually at: http://localhost:8080/admin/"
    echo "Admin credentials: admin / admin123"
    exit 1
fi

echo
echo "====================================================="
echo "   🎉 SETUP COMPLETED SUCCESSFULLY!"
echo "====================================================="
echo
echo -e "${GREEN}📍 Access Information:${NC}"
echo "  Keycloak Admin: http://localhost:8080/admin/"
echo "  Username: admin"
echo "  Password: admin123"
echo
echo "  SIH Realm: http://localhost:8080/realms/sih"
echo "  Token Endpoint: http://localhost:8080/realms/sih/protocol/openid-connect/token"
echo
echo -e "${GREEN}🔐 Client secrets saved to: keycloak-client-secrets.env${NC}"
echo "   Share this file with your team (keep it secure!)"
echo
echo -e "${GREEN}👥 Test Users (password: Password123!):${NC}"
echo "   test-admin, test-police, test-tourism"
echo "   test-operator, test-hotel, test-tourist"
echo
echo -e "${GREEN}📝 Next Steps:${NC}"
echo "   1. Copy keycloak-client-secrets.env to your microservices"
echo "   2. Update your .env files with the client secrets"
echo "   3. Set USE_KEYCLOAK=true in your services"
echo "   4. Test authentication with your applications"
echo
echo -e "${GREEN}📋 Daily Usage:${NC}"
echo "   ./daily-usage.sh - Start/stop/manage Keycloak"
echo
# ============================================================================
# daily-usage.sh - Daily Keycloak Operations (Mac/Linux)
# ============================================================================
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo
echo "====================================================="
echo "   Smart Tourist Safety - Daily Keycloak Usage"
echo "====================================================="
echo

echo "Current Status:"
if docker ps --filter "name=keycloak-sih" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -q "keycloak-sih"; then
    docker ps --filter "name=keycloak-sih" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    docker ps --filter "name=postgres-keycloak" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${YELLOW}❌ Keycloak containers not running or don't exist${NC}"
fi

echo
echo "Available Operations:"
echo
echo -e "${GREEN}1.${NC} 🚀 START Keycloak (daily startup)"
echo -e "${GREEN}2.${NC} ⏹️  STOP Keycloak (end of work)"
echo -e "${GREEN}3.${NC} 🔄 RESTART Keycloak (if issues)"
echo -e "${GREEN}4.${NC} 📊 CHECK Status and Health"
echo -e "${GREEN}5.${NC} 📋 VIEW Logs"
echo -e "${GREEN}6.${NC} 🧪 RUN Tests"
echo -e "${GREEN}7.${NC} 🔧 FIRST TIME SETUP (creates everything)"
echo -e "${GREEN}8.${NC} 💾 BACKUP Configuration"
echo

read -p "Select operation (1-8): " choice

case $choice in
    1)
        echo
        echo -e "${BLUE}[INFO] Starting Keycloak services...${NC}"
        docker-compose -f docker-compose-keycloak.yml up -d
        
        echo -e "${BLUE}[INFO] Waiting for services to be ready...${NC}"
        sleep 30
        
        if docker ps --filter "name=keycloak-sih" --format "{{.Status}}" | grep -q "Up"; then
            echo -e "${GREEN}✅ Keycloak is starting up!${NC}"
            echo
            echo -e "${CYAN}🌐 Access URLs:${NC}"
            echo "  Admin Console: http://localhost:8080/admin/"
            echo "  SIH Realm: http://localhost:8080/realms/sih"
            echo "  Credentials: admin / admin123"
            echo
            echo -e "${YELLOW}⏳ Give it 1-2 minutes to fully initialize...${NC}"
            echo "   You can check status with option 4"
        else
            echo -e "${RED}❌ Keycloak failed to start. Check logs with option 5.${NC}"
        fi
        ;;
        
    2)
        echo
        echo -e "${BLUE}[INFO] Stopping Keycloak services...${NC}"
        docker-compose -f docker-compose-keycloak.yml stop
        
        echo -e "${GREEN}✅ Keycloak services stopped${NC}"
        echo
        echo -e "${CYAN}💡 Your data is preserved. Use option 1 to start again tomorrow.${NC}"
        echo "   To completely remove everything, run ./setup-complete.sh"
        ;;
        
    3)
        echo
        echo -e "${BLUE}[INFO] Restarting Keycloak services...${NC}"
        docker-compose -f docker-compose-keycloak.yml restart
        
        echo -e "${GREEN}✅ Services restarted${NC}"
        echo -e "${YELLOW}⏳ Give it 1-2 minutes to fully restart...${NC}"
        ;;
        
    4)
        echo
        echo -e "${BLUE}[INFO] Checking Keycloak status...${NC}"
        echo
        echo "=== Docker Container Status ==="
        docker ps --filter "name=keycloak" --filter "name=postgres-keycloak"
        
        echo
        echo "=== Health Check ==="
        if curl -f http://localhost:8080/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Keycloak Health: OK${NC}"
        else
            echo -e "${RED}❌ Keycloak Health: FAILED${NC}"
        fi
        
        echo
        echo "=== SIH Realm Check ==="
        if curl -f http://localhost:8080/realms/sih >/dev/null 2>&1; then
            echo -e "${GREEN}✅ SIH Realm: Accessible${NC}"
        else
            echo -e "${RED}❌ SIH Realm: Not accessible${NC}"
        fi
        
        echo
        echo "=== Port Status ==="
        if lsof -i :8080 >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":8080.*LISTEN"; then
            echo -e "${GREEN}✅ Port 8080: Listening${NC}"
        else
            echo -e "${RED}❌ Port 8080: Not listening${NC}"
        fi
        ;;
        
    5)
        echo
        echo -e "${BLUE}[INFO] Recent logs (last 50 lines each)...${NC}"
        echo
        echo "=== Keycloak Logs ==="
        docker logs keycloak-sih --tail 50
        echo
        echo "=== PostgreSQL Logs ==="
        docker logs postgres-keycloak --tail 20
        ;;
        
    6)
        echo
        echo -e "${BLUE}[INFO] Running integration tests...${NC}"
        if [ -f "keycloak-test.py" ]; then
            if command -v python3 >/dev/null 2>&1; then
                python3 keycloak-test.py
            elif command -v python >/dev/null 2>&1; then
                python keycloak-test.py
            else
                echo -e "${RED}❌ Python not found. Please install Python 3.7+${NC}"
            fi
        else
            echo -e "${RED}❌ Test file not found. Make sure keycloak-test.py is in this folder.${NC}"
        fi
        ;;
        
    7)
        echo
        echo -e "${BLUE}[INFO] Running first-time setup...${NC}"
        echo "This will create/recreate all Keycloak configuration."
        echo
        read -p "Continue? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            ./setup-complete.sh
        else
            echo "Setup cancelled."
        fi
        ;;
        
    8)
        echo
        echo -e "${BLUE}[INFO] Creating configuration backup...${NC}"
        backup_name="keycloak-backup-$(date +%Y%m%d_%H%M%S)"
        
        echo "Creating backup: ${backup_name}.sql"
        docker exec postgres-keycloak pg_dump -U keycloak keycloak > "${backup_name}.sql"
        
        if [ -f "${backup_name}.sql" ]; then
            echo -e "${GREEN}✅ Backup created: ${backup_name}.sql${NC}"
            echo "💾 Size: $(ls -lh ${backup_name}.sql | awk '{print $5}')"
        else
            echo -e "${RED}❌ Backup failed${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice. Please select 1-8.${NC}"
        ;;
esac

echo


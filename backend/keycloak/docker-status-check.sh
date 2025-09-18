# ============================================================================
# docker-status-check.sh - Quick Status Checker (Mac/Linux)
# ============================================================================
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo
echo "🔍 Keycloak Status Check"
echo "========================"

echo
echo "📦 Docker Containers:"
docker ps --filter "name=keycloak" --filter "name=postgres-keycloak" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "💾 Docker Volumes:"
docker volume ls --filter "name=keycloak" --format "table {{.Name}}\t{{.Driver}}"

echo
echo "🌐 Port Check:"
if lsof -i :8080 >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":8080.*LISTEN"; then
    echo -e "${GREEN}✅ Port 8080: Listening${NC}"
else
    echo -e "${RED}❌ Port 8080: Not listening${NC}"
fi

if lsof -i :5433 >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":5433.*LISTEN"; then
    echo -e "${GREEN}✅ Port 5433: Listening${NC}"
else
    echo -e "${RED}❌ Port 5433: Not listening${NC}"
fi

echo
echo "🏥 Health Status:"
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Keycloak: Healthy${NC}"
else
    echo -e "${RED}❌ Keycloak: Unhealthy or not running${NC}"
fi

echo
echo "🏠 Realm Status:"
if curl -f http://localhost:8080/realms/sih >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SIH Realm: Accessible${NC}"
else
    echo -e "${RED}❌ SIH Realm: Not accessible${NC}"
fi

echo
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" keycloak-sih postgres-keycloak 2>/dev/null || echo "Containers not running"

echo

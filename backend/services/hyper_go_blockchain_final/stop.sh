#!/bin/bash

# SIH Chaincode Stop Script
echo "🛑 Stopping SIH Chaincode and Services..."

# Function to kill processes by port
kill_process_on_port() {
    local port=$1
    echo "🔍 Checking for processes on port $port..."
    
    # Find process ID using the port
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo "💀 Killing process $pid on port $port"
        kill -9 $pid
        sleep 2
        
        # Double check if process is still running
        local check_pid=$(lsof -ti:$port)
        if [ -z "$check_pid" ]; then
            echo "✅ Successfully stopped process on port $port"
        else
            echo "⚠️  Process on port $port might still be running"
        fi
    else
        echo "ℹ️  No process found on port $port"
    fi
}

# Stop API server (default port 3000)
echo "📡 Stopping SIH API Server..."
kill_process_on_port 3000

# Stop any other Node.js processes that might be running
echo "🟡 Stopping Node.js processes..."
pkill -f "node server.js" 2>/dev/null || echo "ℹ️  No Node.js server processes found"
pkill -f "npm start" 2>/dev/null || echo "ℹ️  No npm processes found"

# Navigate to test-network directory
if [ -d "test-network" ]; then
    cd test-network
    echo "📂 Changed directory to test-network"
else
    echo "❌ test-network directory not found. Make sure you're in the correct directory."
    exit 1
fi

# Stop Hyperledger Fabric network
echo "🌐 Stopping Hyperledger Fabric Network..."
./network.sh down

# Additional cleanup - stop all Hyperledger Fabric related containers
echo "🐳 Stopping all Fabric-related Docker containers..."
docker stop $(docker ps -aq --filter "name=peer") 2>/dev/null || echo "ℹ️  No peer containers found"
docker stop $(docker ps -aq --filter "name=orderer") 2>/dev/null || echo "ℹ️  No orderer containers found"
docker stop $(docker ps -aq --filter "name=ca") 2>/dev/null || echo "ℹ️  No CA containers found"
docker stop $(docker ps -aq --filter "name=cli") 2>/dev/null || echo "ℹ️  No CLI containers found"
docker stop $(docker ps -aq --filter "name=chaincode") 2>/dev/null || echo "ℹ️  No chaincode containers found"

# Remove stopped containers
echo "🗑️  Removing stopped containers..."
docker container prune -f

# Remove unused networks
echo "🌐 Cleaning up Docker networks..."
docker network prune -f

# Remove unused volumes (optional - comment out if you want to keep data)
echo "💾 Cleaning up Docker volumes..."
docker volume prune -f

# Stop any remaining processes on Fabric default ports
echo "🔌 Checking and stopping processes on Fabric ports..."
kill_process_on_port 7050  # Orderer port
kill_process_on_port 7051  # Org1 Peer port
kill_process_on_port 9051  # Org2 Peer port
kill_process_on_port 7054  # Org1 CA port
kill_process_on_port 8054  # Org2 CA port

# Display remaining Docker containers
echo ""
echo "📋 Current Docker containers:"
docker ps -a

# Display remaining Docker networks
echo ""
echo "🌐 Current Docker networks:"
docker network ls

# Display port usage
echo ""
echo "🔌 Current port usage (common Fabric ports):"
echo "Port 3000 (API): $(lsof -ti:3000 || echo 'Free')"
echo "Port 7050 (Orderer): $(lsof -ti:7050 || echo 'Free')"
echo "Port 7051 (Org1 Peer): $(lsof -ti:7051 || echo 'Free')"
echo "Port 9051 (Org2 Peer): $(lsof -ti:9051 || echo 'Free')"
echo "Port 7054 (Org1 CA): $(lsof -ti:7054 || echo 'Free')"
echo "Port 8054 (Org2 CA): $(lsof -ti:8054 || echo 'Free')"

echo ""
echo "✅ SIH Chaincode and all related services have been stopped!"
echo ""
echo "🧹 Cleanup Summary:"
echo "   - API Server stopped"
echo "   - Hyperledger Fabric network stopped"
echo "   - Docker containers removed"
echo "   - Docker networks cleaned"
echo "   - Docker volumes cleaned"
echo "   - All ports freed"
echo ""
echo "💡 To restart everything, run: ./start.sh or follow the setup steps again"

#!/bin/bash
# deploy-chaincode.sh - Script to deploy SIH chaincode to Hyperledger Fabric test network

set -e

# Configuration
CHAINCODE_NAME="sih-chaincode"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"
CC_PACKAGE_ID=""
CHANNEL_NAME="mychannel"
DELAY=3
MAX_RETRY=5
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are available
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v peer &> /dev/null; then
        print_error "peer command not found. Please ensure Fabric binaries are in PATH."
        exit 1
    fi
    
    if ! command -v go &> /dev/null; then
        print_error "go command not found. Please install Go."
        exit 1
    fi
    
    print_info "Prerequisites check passed."
}

# Package the chaincode
package_chaincode() {
    print_info "Packaging chaincode..."
    
    # Remove existing package if it exists
    rm -f ${CHAINCODE_NAME}.tar.gz
    
    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
        --path . \
        --lang golang \
        --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    
    if [ $? -eq 0 ]; then
        print_info "Chaincode packaged successfully: ${CHAINCODE_NAME}.tar.gz"
    else
        print_error "Failed to package chaincode"
        exit 1
    fi
}

# Install chaincode on peer
install_chaincode() {
    local org=$1
    local peer_port=$2
    
    print_info "Installing chaincode on Org${org} peer..."
    
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org${org}MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../test-network/organizations/peerOrganizations/org${org}.example.com/peers/peer0.org${org}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/../test-network/organizations/peerOrganizations/org${org}.example.com/users/Admin@org${org}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${peer_port}
    
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    
    if [ $? -eq 0 ]; then
        print_info "Chaincode installed successfully on Org${org}"
    else
        print_error "Failed to install chaincode on Org${org}"
        exit 1
    fi
}

# Query installed chaincodes to get package ID
query_installed() {
    print_info "Querying installed chaincodes..."
    
    peer lifecycle chaincode queryinstalled >&log.txt
    CC_PACKAGE_ID=$(sed -n "/${CHAINCODE_NAME}_${CHAINCODE_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    
    if [ -z "$CC_PACKAGE_ID" ]; then
        print_error "Package ID not found"
        exit 1
    fi
    
    print_info "Package ID: $CC_PACKAGE_ID"
}

# Approve chaincode definition
approve_chaincode() {
    local org=$1
    local peer_port=$2
    
    print_info "Approving chaincode definition for Org${org}..."
    
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org${org}MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../test-network/organizations/peerOrganizations/org${org}.example.com/peers/peer0.org${org}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/../test-network/organizations/peerOrganizations/org${org}.example.com/users/Admin@org${org}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${peer_port}
    
    peer lifecycle chaincode approveformyorg \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile ${PWD}/../test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
        --channelID $CHANNEL_NAME \
        --name $CHAINCODE_NAME \
        --version $CHAINCODE_VERSION \
        --package-id $CC_PACKAGE_ID \
        --sequence $CHAINCODE_SEQUENCE \
        --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
    
    if [ $? -eq 0 ]; then
        print_info "Chaincode approved for Org${org}"
    else
        print_error "Failed to approve chaincode for Org${org}"
        exit 1
    fi
}

# Check commit readiness
check_commit_readiness() {
    print_info "Checking commit readiness..."
    
    peer lifecycle chaincode checkcommitreadiness \
        --channelID $CHANNEL_NAME \
        --name $CHAINCODE_NAME \
        --version $CHAINCODE_VERSION \
        --sequence $CHAINCODE_SEQUENCE \
        --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')" \
        --output json
}

# Commit chaincode
commit_chaincode() {
    print_info "Committing chaincode..."
    
    peer lifecycle chaincode commit \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile ${PWD}/../test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
        --channelID $CHANNEL_NAME \
        --name $CHAINCODE_NAME \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles ${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles ${PWD}/../test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
        --version $CHAINCODE_VERSION \
        --sequence $CHAINCODE_SEQUENCE \
        --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
    
    if [ $? -eq 0 ]; then
        print_info "Chaincode committed successfully"
    else
        print_error "Failed to commit chaincode"
        exit 1
    fi
}

# Query committed chaincodes
query_committed() {
    print_info "Querying committed chaincodes..."
    
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME
}

# Test chaincode invocation
test_chaincode() {
    print_info "Testing chaincode with sample DID issuance..."
    
    # Set environment for Org1
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    
    # Test IssueDID function
    peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile ${PWD}/../test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
        -C $CHANNEL_NAME \
        -n $CHAINCODE_NAME \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles ${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles ${PWD}/../test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
        -c '{"function":"IssueDID","Args":["did:sih:test123","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Test Authority"]}'
    
    if [ $? -eq 0 ]; then
        print_info "Test invocation successful"
        
        # Test query
        sleep 2
        peer chaincode query \
            -C $CHANNEL_NAME \
            -n $CHAINCODE_NAME \
            -c '{"function":"VerifyDID","Args":["did:sih:test123"]}'
        
        if [ $? -eq 0 ]; then
            print_info "Test query successful"
        else
            print_warn "Test query failed, but chaincode is deployed"
        fi
    else
        print_warn "Test invocation failed, but chaincode may be deployed correctly"
    fi
}

# Main deployment function
deploy() {
    print_info "Starting SIH chaincode deployment..."
    
    check_prerequisites
    package_chaincode
    
    # Install on both orgs
    install_chaincode 1 7051
    install_chaincode 2 9051
    
    # Set environment for Org1 to query
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    
    query_installed
    
    # Approve for both orgs
    approve_chaincode 1 7051
    approve_chaincode 2 9051
    
    check_commit_readiness
    commit_chaincode
    query_committed
    
    print_info "Deployment completed successfully!"
    print_info "You can now test the chaincode functions."
    
    # Optional: Run test
    read -p "Would you like to run a test invocation? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_chaincode
    fi
}

# Clean up function
cleanup() {
    print_info "Cleaning up..."
    rm -f ${CHAINCODE_NAME}.tar.gz
    rm -f log.txt
}

# Help function
show_help() {
    echo "Usage: $0 [OPTION]"
    echo "Deploy SIH chaincode to Hyperledger Fabric test network"
    echo ""
    echo "Options:"
    echo "  deploy    Deploy the chaincode (default)"
    echo "  package   Package the chaincode only"
    echo "  test      Test existing deployed chaincode"
    echo "  clean     Clean up generated files"
    echo "  help      Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - Hyperledger Fabric test network must be running"
    echo "  - peer CLI tool must be available in PATH"
    echo "  - Run this script from the chaincode directory"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "package")
        check_prerequisites
        package_chaincode
        ;;
    "test")
        test_chaincode
        ;;
    "clean")
        cleanup
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

trap cleanup EXIT
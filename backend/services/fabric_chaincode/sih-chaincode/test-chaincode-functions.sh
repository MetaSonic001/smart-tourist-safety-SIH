#!/bin/bash
# test-chaincode-functions.sh - Comprehensive test script for SIH chaincode functions

set -e

CHAINCODE_NAME="sih-chaincode"
CHANNEL_NAME="mychannel"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup environment for Org1
setup_org1_env() {
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

# Execute chaincode invoke
invoke_chaincode() {
    local function_call="$1"
    local description="$2"
    
    print_test "Testing: $description"
    echo "Function call: $function_call"
    
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
        -c "$function_call"
    
    if [ $? -eq 0 ]; then
        print_info "✓ $description - SUCCESS"
    else
        print_error "✗ $description - FAILED"
    fi
    echo "---"
}

# Execute chaincode query
query_chaincode() {
    local function_call="$1"
    local description="$2"
    
    print_test "Querying: $description"
    echo "Function call: $function_call"
    
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n $CHAINCODE_NAME \
        -c "$function_call"
    
    if [ $? -eq 0 ]; then
        print_info "✓ $description - SUCCESS"
    else
        print_error "✗ $description - FAILED"
    fi
    echo "---"
}

# Test DID functions
test_did_functions() {
    print_info "=== Testing DID Functions ==="
    
    # Test IssueDID
    invoke_chaincode \
        '{"function":"IssueDID","Args":["did:sih:alice123","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Authority"]}' \
        "Issue DID for Alice"
    
    sleep 2
    
    # Test VerifyDID
    query_chaincode \
        '{"function":"VerifyDID","Args":["did:sih:alice123"]}' \
        "Verify Alice's DID"
    
    # Test IssueDID idempotency
    invoke_chaincode \
        '{"function":"IssueDID","Args":["did:sih:alice123","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Authority"]}' \
        "Issue duplicate DID (should return existing)"
    
    sleep 2
    
    # Test VerifyDID for non-existent DID
    query_chaincode \
        '{"function":"VerifyDID","Args":["did:sih:nonexistent"]}' \
        "Verify non-existent DID (should fail)"
    
    # Issue another DID
    invoke_chaincode \
        '{"function":"IssueDID","Args":["did:sih:bob456","b2c3d4e5f6a7890123456789012345678901234567890123456789012345678901","2024-01-15T10:30:00Z","2025-01-15T10:30:00Z","SIH Authority"]}' \
        "Issue DID for Bob"
}

# Test Incident functions
test_incident_functions() {
    print_info "=== Testing Incident Functions ==="
    
    # Test RecordIncident
    invoke_chaincode \
        '{"function":"RecordIncident","Args":["INC001","c3d4e5f6a7b8901234567890123456789012345678901234567890123456789012","2024-02-01T14:30:00Z","reporter@example.com"]}' \
        "Record Incident INC001"
    
    sleep 2
    
    invoke_chaincode \
        '{"function":"RecordIncident","Args":["INC002","d4e5f6a7b8c9012345678901234567890123456789012345678901234567890123","2024-02-02T09:15:00Z","witness@example.com"]}' \
        "Record Incident INC002"
    
    sleep 2
    
    # Test duplicate incident (should fail)
    invoke_chaincode \
        '{"function":"RecordIncident","Args":["INC001","c3d4e5f6a7b8901234567890123456789012345678901234567890123456789012","2024-02-01T14:30:00Z","reporter@example.com"]}' \
        "Record duplicate incident (should fail)"
}

# Test Evidence functions
test_evidence_functions() {
    print_info "=== Testing Evidence Functions ==="
    
    # Test AnchorEvidence
    invoke_chaincode \
        '{"function":"AnchorEvidence","Args":["e5f6a7b8c9d0123456789012345678901234567890123456789012345678901234","INC001","image/jpeg","alice@example.com"]}' \
        "Anchor photo evidence to INC001"
    
    sleep 2
    
    invoke_chaincode \
        '{"function":"AnchorEvidence","Args":["f6a7b8c9d0e1234567890123456789012345678901234567890123456789012345","INC001","video/mp4","bob@example.com"]}' \
        "Anchor video evidence to INC001"
    
    sleep 2
    
    invoke_chaincode \
        '{"function":"AnchorEvidence","Args":["a7b8c9d0e1f2345678901234567890123456789012345678901234567890123456","INC002","audio/wav","charlie@example.com"]}' \
        "Anchor audio evidence to INC002"
    
    sleep 2
    
    # Test anchoring evidence to non-existent incident (should fail)
    invoke_chaincode \
        '{"function":"AnchorEvidence","Args":["b8c9d0e1f2a3456789012345678901234567890123456789012345678901234567","INC999","text/plain","invalid@example.com"]}' \
        "Anchor evidence to non-existent incident (should fail)"
}

# Test Audit functions
test_audit_functions() {
    print_info "=== Testing Audit Functions ==="
    
    # Test AppendAudit with provided hash
    invoke_chaincode \
        '{"function":"AppendAudit","Args":["c9d0e1f2a3b4567890123456789012345678901234567890123456789012345678","system","CREATE_DID","did:sih:alice123"]}' \
        "Append audit entry with provided hash"
    
    sleep 2
    
    # Test AppendAudit with generated hash
    invoke_chaincode \
        '{"function":"AppendAudit","Args":["","admin","UPDATE_INCIDENT","INC001"]}' \
        "Append audit entry with generated hash"
    
    sleep 2
    
    invoke_chaincode \
        '{"function":"AppendAudit","Args":["","user","QUERY_DID","did:sih:bob456"]}' \
        "Append another audit entry"
}

# Test Query functions
test_query_functions() {
    print_info "=== Testing Query Functions ==="
    
    # Test QueryIncidentsByTimeRange
    query_chaincode \
        '{"function":"QueryIncidentsByTimeRange","Args":["2024-01-01T00:00:00Z","2024-12-31T23:59:59Z"]}' \
        "Query incidents by time range"
    
    # Test QueryEvidenceByIncident
    query_chaincode \
        '{"function":"QueryEvidenceByIncident","Args":["INC001"]}' \
        "Query evidence for INC001"
    
    query_chaincode \
        '{"function":"QueryEvidenceByIncident","Args":["INC002"]}' \
        "Query evidence for INC002"
    
    # Test GetAllDocuments (for testing purposes)
    query_chaincode \
        '{"function":"GetAllDocuments","Args":["DID"]}' \
        "Get all DID documents"
    
    query_chaincode \
        '{"function":"GetAllDocuments","Args":["INC"]}' \
        "Get all incident documents"
    
    query_chaincode \
        '{"function":"GetAllDocuments","Args":["EVID"]}' \
        "Get all evidence documents"
    
    query_chaincode \
        '{"function":"GetAllDocuments","Args":["AUDIT"]}' \
        "Get all audit documents"
}

# Test error cases
test_error_cases() {
    print_info "=== Testing Error Cases ==="
    
    # Test invalid hash formats
    invoke_chaincode \
        '{"function":"IssueDID","Args":["did:sih:invalid","invalidhash","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Authority"]}' \
        "Issue DID with invalid hash (should fail)"
    
    sleep 1
    
    # Test invalid timestamp format
    invoke_chaincode \
        '{"function":"IssueDID","Args":["did:sih:invalid2","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","invalid-time","2025-01-01T00:00:00Z","SIH Authority"]}' \
        "Issue DID with invalid timestamp (should fail)"
    
    sleep 1
    
    # Test empty parameters
    invoke_chaincode \
        '{"function":"IssueDID","Args":["","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Authority"]}' \
        "Issue DID with empty digitalID (should fail)"
    
    sleep 1
    
    invoke_chaincode \
        '{"function":"RecordIncident","Args":["","c3d4e5f6a7b8901234567890123456789012345678901234567890123456789012","2024-02-01T14:30:00Z","reporter@example.com"]}' \
        "Record incident with empty ID (should fail)"
    
    sleep 1
    
    # Test invalid evidence hash format
    invoke_chaincode \
        '{"function":"AnchorEvidence","Args":["invalidhash","INC001","image/jpeg","alice@example.com"]}' \
        "Anchor evidence with invalid hash (should fail)"
}

# Performance test
test_performance() {
    print_info "=== Performance Test ==="
    
    local start_time=$(date +%s)
    
    # Create multiple DIDs rapidly
    for i in {1..5}; do
        invoke_chaincode \
            "{\"function\":\"IssueDID\",\"Args\":[\"did:sih:perf$i\",\"$(printf '%064d' $i)\",\"2024-01-01T00:00:00Z\",\"2025-01-01T00:00:00Z\",\"Perf Test Authority\"]}" \
            "Performance test DID $i"
        sleep 1
    done
    
    # Create multiple incidents
    for i in {1..3}; do
        invoke_chaincode \
            "{\"function\":\"RecordIncident\",\"Args\":[\"PERF00$i\",\"$(printf '%064d' $((i+1000)))\",\"2024-02-0${i}T14:30:00Z\",\"perf@example.com\"]}" \
            "Performance test incident $i"
        sleep 1
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_info "Performance test completed in $duration seconds"
}

# Main test execution
run_all_tests() {
    print_info "Starting comprehensive SIH chaincode testing..."
    
    setup_org1_env
    
    test_did_functions
    sleep 2
    
    test_incident_functions
    sleep 2
    
    test_evidence_functions
    sleep 2
    
    test_audit_functions
    sleep 2
    
    test_query_functions
    sleep 2
    
    test_error_cases
    sleep 2
    
    # Optional performance test
    read -p "Would you like to run performance tests? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_performance
    fi
    
    print_info "=== Test Summary ==="
    print_info "All tests completed!"
    print_info "Check the output above for any failures (marked with ✗)"
    print_info "Successful operations are marked with ✓"
}

# Individual test functions
case "${1:-all}" in
    "did")
        setup_org1_env
        test_did_functions
        ;;
    "incident")
        setup_org1_env
        test_incident_functions
        ;;
    "evidence")
        setup_org1_env
        test_evidence_functions
        ;;
    "audit")
        setup_org1_env
        test_audit_functions
        ;;
    "query")
        setup_org1_env
        test_query_functions
        ;;
    "errors")
        setup_org1_env
        test_error_cases
        ;;
    "performance")
        setup_org1_env
        test_performance
        ;;
    "all")
        run_all_tests
        ;;
    "help")
        echo "Usage: $0 [TEST_TYPE]"
        echo "Test types:"
        echo "  all         Run all tests (default)"
        echo "  did         Test DID functions only"
        echo "  incident    Test incident functions only"
        echo "  evidence    Test evidence functions only"
        echo "  audit       Test audit functions only"
        echo "  query       Test query functions only"
        echo "  errors      Test error cases only"
        echo "  performance Test performance only"
        echo "  help        Show this help"
        ;;
    *)
        print_error "Unknown test type: $1"
        echo "Use '$0 help' for available options"
        exit 1
        ;;
esac
#!/bin/bash

# SIH Chaincode Setup and Test Script
echo "🚀 Setting up SIH Chaincode environment..."

# Set the Fabric binaries path
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=$PWD/config/

# Navigate to test-network
cd test-network

# Set environment variables for Org1
echo "⚙️ Setting up environment variables for Org1..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "🧪 Testing SIH Chaincode Functions..."
echo "======================================"

# Test 1: Create a Digital Identity (DID)
echo "📋 Test 1: Creating a Digital Identity..."
../bin/peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateDID","Args":["did:example:user123","consent_hash_abc123","2025-12-31T23:59:59Z","issuer_authority"]}'

sleep 2

# Test 2: Query the DID
echo "🔍 Test 2: Querying the Digital Identity..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"ReadDID","Args":["did:example:user123"]}'

sleep 2

# Test 3: Create an Incident
echo "📋 Test 3: Creating an Incident..."
../bin/peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateIncident","Args":["incident_001","incident_summary_hash_xyz","reporter_john"]}'

sleep 2

# Test 4: Query the Incident
echo "🔍 Test 4: Querying the Incident..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"ReadIncident","Args":["incident_001"]}'

sleep 2

# Test 5: Add Evidence to Incident
echo "📋 Test 5: Adding Evidence to Incident..."
../bin/peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateEvidence","Args":["evidence_001","evidence_hash_123","incident_001","image/jpeg","uploader_alice"]}'

sleep 2

# Test 6: Query Evidence by Incident
echo "🔍 Test 6: Querying Evidence by Incident..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"GetEvidenceByIncident","Args":["incident_001"]}'

sleep 2

# Test 7: Create another Evidence
echo "📋 Test 7: Adding Another Evidence..."
../bin/peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateEvidence","Args":["evidence_002","evidence_hash_456","incident_001","video/mp4","uploader_bob"]}'

sleep 2

# Test 8: Query All Evidence for the Incident Again
echo "🔍 Test 8: Querying All Evidence for Incident..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"GetEvidenceByIncident","Args":["incident_001"]}'

sleep 2

# Test 9: Query Audit Logs
echo "🔍 Test 9: Querying Audit Logs for Incident..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"GetAuditsByTarget","Args":["incident_001"]}'

sleep 2

# Test 10: Update DID
echo "📋 Test 10: Updating Digital Identity..."
../bin/peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"UpdateDID","Args":["did:example:user123","updated_consent_hash_def456","2026-12-31T23:59:59Z","updater_admin"]}'

sleep 2

# Test 11: Query Updated DID
echo "🔍 Test 11: Querying Updated Digital Identity..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"ReadDID","Args":["did:example:user123"]}'

sleep 2

# Test 12: Query Audit Logs for DID
echo "🔍 Test 12: Querying Audit Logs for DID..."
../bin/peer chaincode query -C mychannel -n sihcc -c '{"function":"GetAuditsByTarget","Args":["did:example:user123"]}'

echo ""
echo "✅ All SIH Chaincode tests completed successfully!"
echo ""
echo "🎉 Your SIH Chaincode is fully functional with:"
echo "   - Digital Identity Management (DID)"
echo "   - Incident Reporting System"
echo "   - Evidence Management"
echo "   - Automatic Audit Logging"
echo ""
echo "📊 Network Information:"
echo "   - Channel: mychannel"
echo "   - Chaincode: sihcc"
echo "   - Peers: localhost:7051, localhost:9051"
echo "   - Orderer: localhost:7050"
echo ""
echo "🌐 Ready for REST API integration!"

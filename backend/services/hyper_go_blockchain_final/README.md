# SIH Chaincode - Smart Tourism Safety System

A Hyperledger Fabric-based blockchain system for managing Digital Identities (DIDs), Incident Reports, Evidence Management, and Audit Trails for tourism safety.

## Prerequisites

- Docker and Docker Compose
- Go 1.21+
- Node.js (optional, for alternative API)
- Git

## Project Structure

```
asset-transfer-events/
├── chaincode-go/           # SIH Chaincode implementation
├── application-gateway-go/  # Go REST API server
├── test-network/           # Hyperledger Fabric network
├── bin/                    # Fabric binaries
├── config/                 # Fabric configuration
└── scripts/                # Management scripts
```

## Setup Instructions

### Step 1: Start Hyperledger Fabric Network

```bash
# Navigate to test-network directory
cd test-network

# Start the network and create channel
./network.sh up createChannel -c mychannel -ca

# Deploy SIH chaincode
./network.sh deployCC -ccn sihcc -ccp ../chaincode-go/ -ccl go -ccep "OR('Org1MSP.peer','Org2MSP.peer')"
```

### Step 2: Set Environment Variables (for peer commands)

```bash
# From test-network directory
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

### Step 3: Start the Go REST API Server

```bash
# Navigate to application-gateway-go directory
cd ../application-gateway-go

# Install dependencies
go mod tidy

# Build the application
go build -o sih-app *.go

# Start the server
./sih-app
```

The API server will start on `http://localhost:8080`

## API Endpoints

### Base URL: `http://localhost:8080/api/v1`

### Health Check
```bash
curl http://localhost:8080/health
```

### Digital Identity (DID) Management

#### Create DID
```bash
curl -L -X POST http://localhost:8080/api/v1/did \
  -H "Content-Type: application/json" \
  -d '{
    "digitalID": "did:example:tourist123",
    "consentHash": "consent_hash_tourist123",
    "expiresAt": "2025-12-31T23:59:59Z",
    "issuer": "tourism_authority"
  }'
```

#### Get DID
```bash
curl http://localhost:8080/api/v1/did/did:example:tourist123
```

#### Update DID
```bash
curl -L -X PUT http://localhost:8080/api/v1/did/did:example:tourist123 \
  -H "Content-Type: application/json" \
  -d '{
    "consentHash": "updated_consent_hash",
    "expiresAt": "2026-12-31T23:59:59Z",
    "updater": "admin_user"
  }'
```

#### Delete DID
```bash
curl -L -X DELETE http://localhost:8080/api/v1/did/did:example:tourist123 \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "admin_user"
  }'
```

### Incident Management

#### Create Incident
```bash
curl -L -X POST http://localhost:8080/api/v1/incident \
  -H "Content-Type: application/json" \
  -d '{
    "incidentID": "safety_incident_001",
    "incidentSummaryHash": "incident_hash_safety_001",
    "reporter": "tourist_safety_app"
  }'
```

#### Get Incident
```bash
curl http://localhost:8080/api/v1/incident/safety_incident_001
```

#### Update Incident
```bash
curl -L -X PUT http://localhost:8080/api/v1/incident/safety_incident_001 \
  -H "Content-Type: application/json" \
  -d '{
    "incidentSummaryHash": "updated_incident_hash",
    "updater": "safety_supervisor"
  }'
```

#### Delete Incident
```bash
curl -L -X DELETE http://localhost:8080/api/v1/incident/safety_incident_001 \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "admin_user"
  }'
```

### Evidence Management

#### Create Evidence
```bash
curl -L -X POST http://localhost:8080/api/v1/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceID": "photo_evidence_001",
    "evidenceHash": "photo_hash_12345",
    "incidentID": "safety_incident_001",
    "mediaType": "image/jpeg",
    "uploadedBy": "tourist_app_user"
  }'
```

#### Get Evidence
```bash
curl http://localhost:8080/api/v1/evidence/photo_evidence_001
```

#### Update Evidence
```bash
curl -L -X PUT http://localhost:8080/api/v1/evidence/photo_evidence_001 \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceHash": "updated_photo_hash",
    "mediaType": "image/jpeg",
    "updater": "evidence_admin"
  }'
```

#### Delete Evidence
```bash
curl -L -X DELETE http://localhost:8080/api/v1/evidence/photo_evidence_001 \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "admin_user"
  }'
```

#### Get Evidence by Incident
```bash
curl http://localhost:8080/api/v1/evidence/incident/safety_incident_001
```

### Audit Logs

#### Get Audit Logs by Target
```bash
curl http://localhost:8080/api/v1/audit/safety_incident_001
```

## Complete Testing Workflow

### 1. Create a complete tourism safety workflow:

```bash
# 1. Create a tourist's digital identity
curl -L -X POST http://localhost:8080/api/v1/did \
  -H "Content-Type: application/json" \
  -d '{
    "digitalID": "did:tourism:john_doe_001",
    "consentHash": "consent_john_doe_2024",
    "expiresAt": "2025-12-31T23:59:59Z",
    "issuer": "mumbai_tourism_board"
  }'

# 2. Report a safety incident
curl -L -X POST http://localhost:8080/api/v1/incident \
  -H "Content-Type: application/json" \
  -d '{
    "incidentID": "mumbai_safety_001",
    "incidentSummaryHash": "theft_reported_marine_drive",
    "reporter": "tourist_safety_app"
  }'

# 3. Add photo evidence
curl -L -X POST http://localhost:8080/api/v1/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceID": "photo_marine_drive_001",
    "evidenceHash": "sha256_photo_hash_abc123",
    "incidentID": "mumbai_safety_001",
    "mediaType": "image/jpeg",
    "uploadedBy": "did:tourism:john_doe_001"
  }'

# 4. Add video evidence
curl -L -X POST http://localhost:8080/api/v1/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceID": "video_marine_drive_001",
    "evidenceHash": "sha256_video_hash_def456",
    "incidentID": "mumbai_safety_001",
    "mediaType": "video/mp4",
    "uploadedBy": "witness_user_002"
  }'

# 5. Query all evidence for the incident
curl http://localhost:8080/api/v1/evidence/incident/mumbai_safety_001

# 6. Check audit trail
curl http://localhost:8080/api/v1/audit/mumbai_safety_001
```

## Management Commands

### Using Direct Peer Commands (Alternative to API)

```bash
# From test-network directory with environment variables set

# Create DID directly
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n sihcc \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"CreateDID","Args":["did:test:direct","hash123","2025-12-31T23:59:59Z","direct_issuer"]}'

# Query DID directly
peer chaincode query -C mychannel -n sihcc -c '{"function":"ReadDID","Args":["did:test:direct"]}'
```

## Troubleshooting

### Common Issues

1. **Port 8080 already in use**
   ```bash
   # Kill existing process
   lsof -ti:8080 | xargs kill -9
   ```

2. **Network not started**
   ```bash
   cd test-network
   ./network.sh down
   ./network.sh up createChannel -c mychannel -ca
   ```

3. **Certificate path errors**
   - Ensure you're running commands from the correct directory
   - Check that environment variables are set properly

4. **307 Redirect errors**
   - Use `-L` flag with curl to follow redirects
   - Add trailing slashes to POST endpoints

### Logs and Debugging

- **API Server logs**: Check the terminal where `./sih-app` is running
- **Chaincode events**: Events appear in API server logs in real-time
- **Docker logs**: `docker logs [container_name]` for peer/orderer issues

## Cleanup

### Stop Everything
```bash
# Stop API server (Ctrl+C in the terminal)

# Stop network
cd test-network
./network.sh down

# Clean Docker resources
docker system prune -a
```

## Data Models

### DIDDocument
```json
{
  "doc_type": "did",
  "digital_id": "did:example:user123",
  "consent_hash": "consent_hash_value",
  "issued_at": "2025-09-20T13:19:10Z",
  "expires_at": "2025-12-31T23:59:59Z",
  "issuer": "issuer_authority",
  "tx_id": "blockchain_transaction_id"
}
```

### IncidentDocument
```json
{
  "doc_type": "incident",
  "incident_id": "incident_001",
  "incident_summary_hash": "summary_hash_value",
  "created_at": "2025-09-20T13:19:10Z",
  "reporter": "reporter_identity",
  "tx_id": "blockchain_transaction_id"
}
```

### EvidenceDocument
```json
{
  "doc_type": "evidence",
  "evidence_hash": "evidence_hash_value",
  "incident_id": "incident_001",
  "media_type": "image/jpeg",
  "uploaded_by": "uploader_identity",
  "created_at": "2025-09-20T13:19:10Z",
  "tx_id": "blockchain_transaction_id"
}
```

### AuditDocument
```json
{
  "doc_type": "audit",
  "audit_hash": "audit_hash_value",
  "actor": "user_identity",
  "action": "CREATE_DID",
  "target_id": "target_document_id",
  "timestamp": "2025-09-20T13:19:10Z",
  "tx_id": "blockchain_transaction_id"
}
```

## Security Features

- **Immutable Records**: All data stored on blockchain cannot be tampered with
- **Audit Trail**: Every operation is automatically logged
- **Digital Signatures**: All transactions are cryptographically signed
- **Consent Management**: DID system ensures user consent tracking
- **Evidence Integrity**: Hash-based verification of evidence files

## Integration Notes

This system provides REST APIs that can be integrated with:
- Mobile tourism apps
- Web dashboards
- Government systems
- Emergency services
- Tourism operator platforms

The blockchain ensures all safety incidents and evidence are permanently recorded and verifiable.


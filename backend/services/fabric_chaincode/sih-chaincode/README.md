# SIH (Safety & Integrity Hub) Chaincode

A Hyperledger Fabric smart contract for managing Digital IDs, incident reports, evidence anchoring, and audit trails with privacy-preserving hash-based integrity proofs.

## Overview

The SIH chaincode provides secure, tamper-proof storage and verification for:
- **Digital Identity (DID)** issuance and verification
- **Incident reporting** with cryptographic summaries
- **Evidence anchoring** linking multimedia evidence to incidents
- **Audit logging** for comprehensive traceability

### Key Features

- **Privacy-First**: Only stores hashes and metadata, never PII or raw location data
- **Cryptographically Secure**: SHA-256 hash validation for all evidence and consent data
- **Tamper-Proof**: Immutable blockchain storage with endorsement policies
- **Rich Queries**: CouchDB support for complex time-range and incident-based queries
- **Audit Trail**: Complete action logging for compliance and forensics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Digital IDs   │    │   Incidents     │    │   Evidence      │
│   DID#<id>      │    │   INC#<id>      │    │   EVID#<hash>   │
│                 │    │                 │    │                 │
│ • consent_hash  │    │ • summary_hash  │    │ • incident_id   │
│ • issued_at     │    │ • created_at    │    │ • media_type    │
│ • expires_at    │    │ • reporter      │    │ • uploaded_by   │
│ • issuer        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Audit Logs    │
                        │   AUDIT#<hash>  │
                        │                 │
                        │ • actor         │
                        │ • action        │
                        │ • target_id     │
                        │ • timestamp     │
                        └─────────────────┘
```

## Prerequisites

### System Requirements
- **Go** 1.19 or higher
- **Hyperledger Fabric** 2.4+ with peer CLI tools
- **CouchDB** for rich queries (recommended)
- **Docker** for running test network

### Network Setup
1. Clone Hyperledger Fabric samples:
```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.4.7 1.5.5
cd fabric-samples/test-network
```

2. Start the test network with CouchDB:
```bash
./network.sh up createChannel -ca -s couchdb
```

3. Verify the network is running:
```bash
docker ps
# Should show orderer, peer, and couchdb containers
```

## Installation

### 1. Clone and Setup Chaincode

```bash
# Navigate to the test network directory
cd fabric-samples/test-network

# Create chaincode directory
mkdir -p ../sih-chaincode
cd ../sih-chaincode

# Copy the chaincode files (main.go, go.mod, etc.)
# ... (copy all the provided files)
```

### 2. Deploy Chaincode

Use the provided deployment script:

```bash
chmod +x deploy-chaincode.sh
./deploy-chaincode.sh
```

Or deploy manually:

```bash
# Package
peer lifecycle chaincode package sih-chaincode.tar.gz \
    --path . --lang golang --label sih-chaincode_1.0

# Install on both peers
# ... (see deploy-chaincode.sh for full commands)
```

### 3. Verify Deployment

```bash
peer lifecycle chaincode querycommitted --channelID mychannel
```

## Chaincode Functions

### Digital ID Functions

#### `IssueDID(digitalId, consentHash, issuedAt, expiresAt, issuer)`

Issues a new Digital ID with consent verification.

**Parameters:**
- `digitalId` (string): Unique DID identifier (e.g., "did:sih:123456789")
- `consentHash` (string): SHA-256 hash of consent data (64 hex chars)
- `issuedAt` (string): ISO 8601 timestamp (RFC3339 format)
- `expiresAt` (string): ISO 8601 timestamp (RFC3339 format)
- `issuer` (string): Issuing authority identifier

**Returns:** Transaction ID

**Example:**
```bash
peer chaincode invoke -C mychannel -n sih-chaincode \
    -c '{"function":"IssueDID","Args":["did:sih:alice123","a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890","2024-01-01T00:00:00Z","2025-01-01T00:00:00Z","SIH Authority"]}'
```

#### `VerifyDID(digitalId)`

Retrieves and verifies a Digital ID.

**Parameters:**
- `digitalId` (string): DID to verify

**Returns:** DID document or error if not found

**Example:**
```bash
peer chaincode query -C mychannel -n sih-chaincode \
    -c '{"function":"VerifyDID","Args":["did:sih:alice123"]}'
```

### Incident Functions

#### `RecordIncident(incidentId, incidentSummaryHash, createdAt, reporter)`

Records a new incident with cryptographic summary.

**Parameters:**
- `incidentId` (string): Unique incident identifier
- `incidentSummaryHash` (string): SHA-256 hash of incident summary
- `createdAt` (string): ISO 8601 timestamp
- `reporter` (string): Reporter identifier

**Returns:** Transaction ID

**Example:**
```bash
peer chaincode invoke -C mychannel -n sih-chaincode \
    -c '{"function":"RecordIncident","Args":["INC001","c3d4e5f6a7b8901234567890123456789012345678901234567890123456789012","2024-02-01T14:30:00Z","reporter@example.com"]}'
```

### Evidence Functions

#### `AnchorEvidence(evidenceHash, incidentId, mediaType, uploadedBy)`

Anchors evidence to an existing incident.

**Parameters:**
- `evidenceHash` (string): SHA-256 hash of evidence file
- `incidentId` (string): Associated incident ID
- `mediaType` (string): MIME type of evidence
- `uploadedBy` (string): Uploader identifier

**Returns:** Transaction ID

**Example:**
```bash
peer chaincode invoke -C mychannel -n sih-chaincode \
    -c '{"function":"AnchorEvidence","Args":["e5f6a7b8c9d0123456789012345678901234567890123456789012345678901234","INC001","image/jpeg","witness@example.com"]}'
```

### Audit Functions

#### `AppendAudit(auditHash, actor, action, targetId)`

Creates an audit log entry.

**Parameters:**
- `auditHash` (string): SHA-256 hash (leave empty for auto-generation)
- `actor` (string): User/system performing action
- `action` (string): Action performed
- `targetId` (string): Target resource ID

**Returns:** Transaction ID

**Example:**
```bash
peer chaincode invoke -C mychannel -n sih-chaincode \
    -c '{"function":"AppendAudit","Args":["","system","CREATE_DID","did:sih:alice123"]}'
```

### Query Functions

#### `QueryIncidentsByTimeRange(startTime, endTime)`

Retrieves incidents within a time range.

**Parameters:**
- `startTime` (string): Start timestamp (ISO 8601)
- `endTime` (string): End timestamp (ISO 8601)

**Returns:** Array of incident documents

**Example:**
```bash
peer chaincode query -C mychannel -n sih-chaincode \
    -c '{"function":"QueryIncidentsByTimeRange","Args":["2024-01-01T00:00:00Z","2024-12-31T23:59:59Z"]}'
```

#### `QueryEvidenceByIncident(incidentId)`

Retrieves all evidence for a specific incident.

**Parameters:**
- `incidentId` (string): Incident ID

**Returns:** Array of evidence documents

**Example:**
```bash
peer chaincode query -C mychannel -n sih-chaincode \
    -c '{"function":"QueryEvidenceByIncident","Args":["INC001"]}'
```

## Document Schemas

### DID Document
```json
{
    "doc_type": "DID",
    "digital_id": "did:sih:123456789",
    "consent_hash": "a1b2c3d4e5f6...",
    "issued_at": "2024-01-01T00:00:00Z",
    "expires_at": "2025-01-01T00:00:00Z",
    "issuer": "SIH Authority",
    "tx_id": "abc123..."
}
```

### Incident Document
```json
{
    "doc_type": "INC",
    "incident_id": "INC001",
    "incident_summary_hash": "c3d4e5f6a7b8...",
    "created_at": "2024-02-01T14:30:00Z",
    "reporter": "reporter@example.com",
    "tx_id": "def456..."
}
```

### Evidence Document
```json
{
    "doc_type": "EVID",
    "evidence_hash": "e5f6a7b8c9d0...",
    "incident_id": "INC001",
    "media_type": "image/jpeg",
    "uploaded_by": "witness@example.com",
    "created_at": "2024-02-01T14:35:00Z",
    "tx_id": "ghi789..."
}
```

### Audit Document
```json
{
    "doc_type": "AUDIT",
    "audit_hash": "c9d0e1f2a3b4...",
    "actor": "system",
    "action": "CREATE_DID",
    "target_id": "did:sih:alice123",
    "timestamp": "2024-02-01T14:30:00Z",
    "tx_id": "jkl012..."
}
```

## Testing

### Unit Tests

Run the comprehensive test suite:

```bash
go test -v
```

For benchmarks:
```bash
go test -bench=.
```

### Integration Tests

Use the provided test script for end-to-end testing:

```bash
chmod +x test-chaincode-functions.sh
./test-chaincode-functions.sh all
```

Test specific function groups:
```bash
./test-chaincode-functions.sh did      # Test DID functions only
./test-chaincode-functions.sh incident # Test incident functions only
./test-chaincode-functions.sh evidence # Test evidence functions only
./test-chaincode-functions.sh query    # Test query functions only
```

### Test Coverage

The test suite covers:
- ✅ All core functions (IssueDID, VerifyDID, RecordIncident, etc.)
- ✅ Input validation and error handling
- ✅ Hash format validation (SHA-256)
- ✅ Timestamp validation (RFC3339)
- ✅ Idempotency testing
- ✅ Query functionality
- ✅ Performance benchmarks

## Security Features

### Input Validation
- **Hash Validation**: All hashes must be valid SHA-256 (64 hex characters)
- **Timestamp Validation**: All timestamps must be RFC3339 format
- **Required Fields**: Empty parameters are rejected
- **PII Protection**: No Aadhaar numbers, GPS coordinates, or raw personal data accepted

### Access Control
- **Endorsement Policy**: `OR('Org1MSP.peer','Org2MSP.peer')` for development
- **Identity Tracking**: All operations include issuer/actor identification
- **Audit Trail**: Complete logging of all operations

### Data Integrity
- **Immutable Records**: Blockchain ensures tamper-proof storage
- **Cryptographic Hashes**: All sensitive data stored as SHA-256 hashes only
- **Transaction IDs**: Every operation returns verifiable transaction ID

## Production Configuration

### Endorsement Policies

For production, configure stricter policies:

```bash
# Multi-org endorsement
--signature-policy "AND('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"

# Threshold-based
--signature-policy "OutOf(2,'Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"
```

### Performance Optimization

1. **CouchDB Indexes**: Create indexes for frequent queries
```json
{
   "index":{
      "fields":["doc_type","created_at"]
   },
   "ddoc":"indexCreatedAtDoc",
   "name":"indexCreatedAt",
   "type":"json"
}
```

2. **Connection Profiles**: Use connection profiles for client applications
3. **State Database**: Consider using CouchDB for rich queries in production

## Troubleshooting

### Common Issues

1. **Package Installation Failed**
   ```bash
   # Check peer connectivity
   peer version
   # Verify network is running
   docker ps
   ```

2. **Endorsement Policy Violations**
   ```bash
   # Check org MSP configuration
   peer channel getinfo -c mychannel
   ```

3. **Query Failures**
   ```bash
   # Verify CouchDB is running
   curl http://localhost:5984/_all_dbs
   ```

### Debug Commands

```bash
# Check chaincode logs
docker logs peer0.org1.example.com

# Verify chaincode installation
peer lifecycle chaincode queryinstalled

# Check committed definitions
peer lifecycle chaincode querycommitted -C mychannel
```

## API Integration

### REST Gateway

Use Fabric Gateway API for REST access:

```javascript
// Example Node.js client
const { Gateway, Wallets } = require('fabric-network');

async function issueDID(digitalId, consentHash, issuedAt, expiresAt, issuer) {
    const contract = network.getContract('sih-chaincode');
    const result = await contract.submitTransaction('IssueDID', 
        digitalId, consentHash, issuedAt, expiresAt, issuer);
    return result.toString();
}
```

### Direct Peer API

```bash
# Using peer CLI in applications
peer chaincode invoke -C mychannel -n sih-chaincode \
    --peerAddresses peer0.org1.example.com:7051 \
    -c '{"function":"IssueDID","Args":[...]}'
```

## Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-function`
3. Add comprehensive tests for new functionality
4. Ensure all tests pass: `go test -v`
5. Submit pull request

### Code Standards

- Follow Go best practices and gofmt formatting
- Add comprehensive error handling and validation
- Include unit tests for all new functions
- Update documentation for API changes
- Maintain backwards compatibility

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Hyperledger Fabric documentation
3. Submit issues on the project repository
4. Join the Hyperledger Discord for community support

---

**Security Notice**: This chaincode is designed for integrity verification and audit trails. Always validate data before submitting hashes to the blockchain. Never store PII or sensitive raw data on-chain.
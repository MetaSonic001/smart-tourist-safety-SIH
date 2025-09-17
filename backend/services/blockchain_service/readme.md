# Blockchain Bridge Service

A FastAPI-based service that provides a REST wrapper for submitting transactions to Hyperledger Fabric chaincode. This service handles integrity anchors (hashes + metadata) for DID management, incident recording, and evidence anchoring.

## Features

- **REST API** for Hyperledger Fabric integration
- **Transaction Management** for DIDs, incidents, and evidence
- **Redis Pub/Sub** for transaction confirmations
- **PostgreSQL** for transaction receipts
- **Development Mode** with mock transactions
- **Health Checks** and monitoring endpoints

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│ Blockchain Bridge│───▶│ Hyperledger     │
│                 │    │     Service      │    │    Fabric       │
│ • Auth Service  │    │   (Port 8002)    │    │   Chaincode     │
│ • Alert Service │    │                  │    │                 │
│ • Operator UI   │    └──────────────────┘    └─────────────────┘
└─────────────────┘              │
                                 ▼
                    ┌──────────────────┐    ┌─────────────────┐
                    │    PostgreSQL    │    │      Redis      │
                    │  (Tx Receipts)   │    │   (Pub/Sub)     │
                    └──────────────────┘    └─────────────────┘
```

## Supported Operations

### Transaction Types
1. **IssueDID**: Store digital identity with consent hash
2. **RecordIncident**: Store incident summary hash
3. **AnchorEvidence**: Store evidence hash linked to incident
4. **AppendAudit**: Store audit block hash (optional)

### API Endpoints
- `POST /transactions` - Submit transaction to blockchain
- `POST /queries` - Query blockchain for DID/incident status
- `GET /transactions/{tx_id}` - Get transaction status
- `GET /transactions` - List transactions with filtering
- `GET /health` - Service health check

## Setup & Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and setup**:
```bash
git clone <repository>
cd blockchain-bridge
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**:
```bash
# Create PostgreSQL database
createdb blockchain_bridge

# Tables will be created automatically on startup
```

### Configuration Options

#### Fabric Connection Methods

The service supports two methods to connect to Hyperledger Fabric:

**Method 1: REST Gateway (Recommended)**
```bash
FABRIC_GATEWAY_URL=https://your-fabric-gateway:8080
FABRIC_DEV_MODE=false
```

**Method 2: Fabric Python SDK**
```bash
FABRIC_SDK_CONFIG=/app/fabric_config/connection-profile.yaml
WALLET_PATH=/app/fabric_wallet
FABRIC_DEV_MODE=false
```

**Method 3: Development Mode**
```bash
FABRIC_DEV_MODE=true
```

#### Environment Variables

```bash
# Fabric Configuration
FABRIC_GATEWAY_URL=https://your-fabric-gateway:8080
FABRIC_SDK_CONFIG=/app/fabric_config/connection-profile.yaml
WALLET_PATH=/app/fabric_wallet
CHAINCODE_NAME=integrity_anchor
CHANNEL_NAME=mainchannel

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/blockchain_bridge

# Redis
REDIS_URL=redis://localhost:6379

# Security
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Development
FABRIC_DEV_MODE=false
```

### Running the Service

#### Option 1: Direct Python
```bash
# Development
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8002 --workers 4
```

#### Option 2: Docker Compose
```bash
# Start all services (includes PostgreSQL and Redis)
docker-compose up -d

# Development mode with Redis GUI
docker-compose --profile dev up -d

# View logs
docker-compose logs -f blockchain-bridge
```

## Fabric Chaincode Requirements

Your Go chaincode should implement these functions:

```go
// Transaction functions
func (s *SmartContract) issue_did(ctx contractapi.TransactionContextInterface, payloadHash string, metadata string) error
func (s *SmartContract) record_incident(ctx contractapi.TransactionContextInterface, payloadHash string, metadata string) error
func (s *SmartContract) anchor_evidence(ctx contractapi.TransactionContextInterface, payloadHash string, metadata string) error
func (s *SmartContract) append_audit(ctx contractapi.TransactionContextInterface, payloadHash string, metadata string) error

// Query functions
func (s *SmartContract) query_did(ctx contractapi.TransactionContextInterface, digitalId string) (string, error)
func (s *SmartContract) query_incident(ctx contractapi.TransactionContextInterface, incidentId string) (string, error)
func (s *SmartContract) query_evidence(ctx contractapi.TransactionContextInterface, incidentId string) (string, error)
```

## Usage Examples

### Submit DID Transaction
```bash
curl -X POST "http://localhost:8002/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "op": "issue_did",
    "payload_hash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "metadata": {
      "digital_id": "did:example:123456",
      "consent_hash": "consent_hash_example",
      "issued_at": "2025-01-15T10:00:00Z",
      "expires_at": "2026-01-15T10:00:00Z",
      "issuer": "emergency_authority"
    }
  }'
```

### Record Incident
```bash
curl -X POST "http://localhost:8002/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "op": "record_incident",
    "payload_hash": "b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1",
    "metadata": {
      "incident_id": "INC-2025-001",
      "incident_summary_hash": "summary_hash_example",
      "created_at": "2025-01-15T14:30:00Z",
      "reporter": "emergency_operator_001"
    }
  }'
```

### Anchor Evidence
```bash
curl -X POST "http://localhost:8002/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "op": "anchor_evidence",
    "payload_hash": "c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2",
    "metadata": {
      "evidence_hash": "audio_recording_hash_example",
      "incident_id": "INC-2025-001",
      "uploaded_by": "emergency_operator_001"
    }
  }'
```

### Query Blockchain
```bash
curl -X POST "http://localhost:8002/queries" \
  -H "Content-Type: application/json" \
  -d '{
    "query_type": "did",
    "target_id": "did:example:123456"
  }'
```

### Check Transaction Status
```bash
curl "http://localhost:8002/transactions/550e8400-e29b-41d4-a716-446655440000"
```

## Redis Events

The service publishes confirmation events to Redis channel `blockchain.tx.confirmed`:

```json
{
  "tx_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "issue_did",
  "target_id": "did:example:123456",
  "block_no": 12345,
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### Subscribe to Events
```bash
# Redis CLI
redis-cli SUBSCRIBE blockchain.tx.confirmed

# Python example
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe('blockchain.tx.confirmed')

for message in pubsub.listen():
    if message['type'] == 'message':
        event = json.loads(message['data'])
        print(f"Transaction confirmed: {event['tx_id']}")
```

## Development & Testing

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest test_main.py -v

# Run with coverage
pytest test_main.py --cov=main --cov-report=html
```

### Development Mode
Set `FABRIC_DEV_MODE=true` to enable mock transactions:
- Transactions return fake tx_ids
- Confirmations are simulated
- No actual Fabric network required
- Useful for development and testing

### Mock Mode Features
- Instant transaction responses
- Simulated 2-second confirmation delay
- Predictable tx_ids for testing
- All endpoints work normally

## Security Considerations

### Data Protection
- **No PII Storage**: Only hashes and metadata stored
- **Encryption**: Sensitive metadata encrypted with `ENCRYPTION_KEY`
- **TLS**: All Fabric communications use TLS
- **SQL Injection**: Protected via parameterized queries

### Access Control
- Consider implementing API authentication
- Use environment-specific encryption keys
- Secure Fabric wallet certificates
- Network-level access controls

## Monitoring & Logging

### Health Check
```bash
curl http://localhost:8002/health
```

### Metrics
- Transaction submission rates
- Confirmation latency
- Error rates
- Database connection health

### Logging
Structured logging with:
- Transaction submissions
- Fabric interactions
- Confirmation events
- Error conditions

## Troubleshooting

### Common Issues

**1. Fabric Connection Errors**
```bash
# Check gateway accessibility
curl -k https://your-fabric-gateway:8080/health

# Verify certificates in wallet
ls -la /app/fabric_wallet/
```

**2. Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check tables
psql $DATABASE_URL -c "\dt"
```

**3. Redis Connection Issues**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check published events
redis-cli -u $REDIS_URL MONITOR
```

**4. Transaction Validation Errors**
- Ensure payload_hash is exactly 64 characters (SHA256)
- Verify payload_hash is valid hexadecimal
- Check operation type is supported

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn main:app --log-level debug
```

## Integration Points

### Called By
- **Auth & Onboarding Service**: DID issuance
- **Alert Management Service**: Incident recording
- **Operator Dashboard**: Evidence anchoring

### Calls To
- **Hyperledger Fabric**: Transaction submission
- **PostgreSQL**: Receipt storage
- **Redis**: Event publishing

## Performance

### Recommended Specs
- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Storage**: SSD for database
- **Network**: Low latency to Fabric network

### Scaling
- Horizontal scaling supported
- Database connection pooling
- Redis clustering for high availability
- Load balancer for multiple instances

## License

[Your License Here]

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## Support

For issues and questions:
- Check logs: `docker-compose logs blockchain-bridge`
- Review health endpoint: `http://localhost:8002/health`
- Enable debug mode for detailed logging
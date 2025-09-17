# ALERTS & INCIDENT Microservice

A comprehensive FastAPI microservice for SOS alert ingestion, incident lifecycle management, and automated e-FIR generation with blockchain anchoring.

## Features

- **SOS Alert Ingestion**: Accept alerts from mobile apps, SMS, or IoT devices
- **Smart Incident Creation**: Automatic clustering of nearby alerts to create incidents
- **e-FIR Generation**: Automated PDF generation with blockchain anchoring for tamper-evidence
- **ML Integration**: Risk scoring for individuals and locations
- **Real-time Events**: Redis pub/sub for dashboard and operator notifications
- **Secure Authentication**: JWT-based authentication with role-based access control

## Architecture

### Core Components

1. **Alert Processing**: Ingest and validate SOS alerts
2. **Clustering Engine**: Geographic and temporal clustering for incident creation
3. **e-FIR Generator**: PDF generation using ReportLab
4. **Blockchain Integration**: Evidence anchoring for tamper-proof records
5. **Event System**: Real-time notifications via Redis

### Data Models

- **Alerts**: Individual SOS signals with location and metadata
- **Incidents**: Aggregated alerts requiring response coordination
- **e-FIR**: Electronically generated First Information Reports

## API Endpoints

### Alerts
- `POST /alerts/sos` - Create new SOS alert
- `GET /alerts/{alert_id}` - Get alert details
- `GET /alerts/` - List alerts (paginated)

### Incidents
- `GET /incidents/{incident_id}` - Get incident details
- `GET /incidents/` - List incidents (paginated)
- `PUT /incidents/{incident_id}` - Update incident status
- `POST /incidents/{incident_id}/generate-efir` - Generate e-FIR PDF

## Installation & Setup

### Using Docker Compose (Recommended)

```bash
# Clone and setup
git clone <repository>
cd alerts-incident-service

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f alerts-incident-api
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/alertsdb"
export REDIS_URL="redis://localhost:6379/0"
# ... other env vars from .env.example

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8005 --reload
```

## Configuration

Key environment variables:

```bash
# Core Service
SERVICE_PORT=8005
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
REDIS_URL=redis://host:port/db

# MinIO (Document Storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# External Services
BLOCKCHAIN_URL=http://blockchain-service:8003
ML_URL=http://ml-service:8002
OPERATOR_URL=http://operator-service:8004

# Security
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# Clustering Parameters
INCIDENT_CLUSTER_THRESHOLD=3
INCIDENT_CLUSTER_RADIUS_KM=2.0
INCIDENT_CLUSTER_TIME_WINDOW_HOURS=2

# Development
USE_FAKE_BLOCKCHAIN=true
```

## Usage Examples

### Creating an SOS Alert

```python
import httpx
import asyncio

async def create_alert():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8005/alerts/sos",
            json={
                "alert_id": "sos_001",
                "digital_id": "DID123456789",
                "tourist_id": "TOURIST_001",
                "lat": 19.0760,
                "lng": 72.8777,
                "timestamp": "2024-01-15T10:30:00Z",
                "source": "app",
                "media_refs": ["image1.jpg", "location_audio.mp3"]
            },
            headers={"Authorization": "Bearer YOUR_JWT_TOKEN"}
        )
        print(response.json())

asyncio.run(create_alert())
```

### Generating an e-FIR

```python
async def generate_efir(incident_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://localhost:8005/incidents/{incident_id}/generate-efir",
            headers={"Authorization": "Bearer YOUR_JWT_TOKEN"}
        )
        efir_data = response.json()
        print(f"e-FIR generated: {efir_data['efir_hash']}")
        print(f"Blockchain TX: {efir_data['blockchain_tx_id']}")
```

## Testing

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_alerts.py -v
pytest tests/test_efir.py -v
pytest tests/test_blockchain.py -v

# Run with coverage
pytest --cov=app tests/
```

## Event System

The service publishes events to Redis for real-time coordination:

### Published Events

- `alert.created` - New alert received
- `incident.created` - Incident auto-created from clustering
- `incident.updated` - Incident status changed
- `efir.generated` - e-FIR PDF generated and anchored

### Event Payloads

```json
{
  "alert.created": {
    "alert_id": "string",
    "digital_id": "string",
    "lat": 19.0760,
    "lng": 72.8777,
    "timestamp": "ISO8601",
    "source": "app|sms|iot",
    "media_refs": ["array"]
  },
  "incident.created": {
    "incident_id": "string",
    "related_alerts": ["array"],
    "priority": 3,
    "created_at": "ISO8601"
  }
}
```

## Security Features

- JWT authentication for all endpoints
- Role-based access control (user, operator, admin)
- SHA256 hashing of e-FIR documents
- Blockchain anchoring for tamper-evidence
- Secure MinIO integration for document storage

## Production Considerations

1. **Database**: Use PostgreSQL with connection pooling
2. **Redis**: Configure persistence and clustering
3. **MinIO**: Set up distributed mode for high availability
4. **Monitoring**: Add health checks and metrics
5. **Scaling**: Use horizontal scaling with load balancing
6. **Security**: Rotate JWT secrets, use HTTPS, implement rate limiting

## Integration Points

- **Mobile Apps**: Direct SOS alert submission
- **SMS Gateway**: Fallback alert ingestion via Notification service
- **ML Service**: Real-time risk assessment
- **Blockchain Service**: Evidence anchoring
- **Operator Dashboard**: Real-time incident monitoring
- **112/Emergency Services**: Automated notifications

## License

This microservice is part of a comprehensive emergency response system designed for tourist safety and efficient incident management.
            
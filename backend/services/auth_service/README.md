# Smart Tourist Safety - Auth & Onboarding Service

A production-ready FastAPI microservice for authentication, authorization, and tourist onboarding as part of the Smart Tourist Safety Monitoring system.

## Features

- 🔐 **Authentication & RBAC**: Keycloak integration with OAuth2 fallback
- 👤 **User Management**: Multi-role support (admin, police, tourism_officer, operator_112, hotel, tourist)
- 📱 **Onboarding Flows**: Support for kiosk, app, and hotel entry points
- 🔒 **Privacy-First**: Encrypted PII storage with pointer-based architecture
- 🌐 **Blockchain Integration**: Digital ID issuance with consent tracking
- 📡 **Event-Driven**: Redis pub/sub + webhook notifications
- 🗄️ **Secure Storage**: MinIO with server-side encryption
- 🧪 **Test Coverage**: Unit tests and API endpoint testing

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │  Keycloak   │    │ Blockchain  │
│(Kiosk/App)  │    │(Optional)   │    │  Service    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │                  │                  │
┌──────▼──────────────────▼──────────────────▼──────┐
│          Auth & Onboarding Service                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │    Auth    │ │ Onboarding │ │  Events    │    │
│  │  Manager   │ │  Service   │ │  Service   │    │
│  └────────────┘ └────────────┘ └────────────┘    │
└─────┬─────────────┬─────────────┬─────────────────┘
      │             │             │
┌─────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│ PostgreSQL │ │  MinIO   │ │   Redis    │
│    DB      │ │ Storage  │ │  Pub/Sub   │
└────────────┘ └──────────┘ └────────────┘
```

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Run with Docker Compose (Recommended)

```bash
# Start all services (Postgres, MinIO, Redis, Auth Service)
docker-compose up -d

# Check service health
curl http://localhost:8001/health

# View logs
docker-compose logs -f auth-service
```

### 3. Manual Setup (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Start infrastructure services
docker-compose up -d postgres minio redis

# Initialize database
alembic upgrade head

# Run the service
python main.py
```

### 4. Enable Keycloak (Optional)

```bash
# Start with Keycloak profile
docker-compose --profile keycloak up -d

# Update .env
USE_KEYCLOAK=true
KEYCLOAK_SERVER_URL=http://localhost:8080
```

## API Usage

### 1. User Registration

```bash
curl -X POST "http://localhost:8001/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "tourist"
  }'
```

### 2. Authentication

```bash
curl -X POST "http://localhost:8001/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"
```

### 3. Start Onboarding

```bash
curl -X POST "http://localhost:8001/onboarding/start" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_point": "kiosk",
    "device_id": "kiosk_001"
  }'
```

### 4. Submit KYC

```bash
# With DigiLocker token
curl -X POST "http://localhost:8001/onboarding/{session_id}/kyc" \
  -H "Content-Type: multipart/form-data" \
  -F "kyc_token=digilocker_token_123456" \
  -F "consent_scope=tracking,location,emergency"

# With document upload
curl -X POST "http://localhost:8001/onboarding/{session_id}/kyc" \
  -H "Content-Type: multipart/form-data" \
  -F "id_document=@passport.jpg" \
  -F "consent_scope=tracking,location,emergency"
```

### 5. Complete Onboarding

```bash
curl -X POST "http://localhost:8001/onboarding/{session_id}/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "opt_in_tracking": true,
    "trip_end_date": "2024-12-31T23:59:59"
  }'
```

## Database Schema

### Main Tables

- **tourists**: Core tourist records with encrypted PII pointers
- **onboarding_sessions**: Temporary onboarding workflow tracking
- **users**: User accounts for system operators

### Key Fields

- `digital_id`: Unique UUID for tourist identification
- `pii_pointer`: Encrypted reference to actual PII data
- `consent_hash`: SHA256 of consent blob + timestamp
- `blockchain_tx_id`: Transaction ID from blockchain service

## Blockchain Integration

The service calls the Blockchain Service with this payload:

```json
{
  "digital_id": "550e8400-e29b-41d4-a716-446655440000",
  "consent_hash": "a1b2c3d4e5f6...",
  "issued_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-02-14T10:30:00Z",
  "issuer": "airport_kiosk"
}
```

Expected response:
```json
{
  "tx_id": "0x1234567890abcdef",
  "status": "success"
}
```

## Event System

### Redis Pub/Sub Channel: `tourist.onboarded`

Event payload:
```json
{
  "digital_id": "550e8400-e29b-41d4-a716-446655440000",
  "tourist_id": "660e8400-e29b-41d4-a716-446655440001",
  "consent_hash": "a1b2c3d4e5f6...",
  "issued_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-02-14T10:30:00Z",
  "entry_point": "kiosk"
}
```

### Dashboard Webhook

Same payload sent to `{DASHBOARD_URL}/internal/event`

## Testing

### Run Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Mock Mode

Set `MOCK_MODE=true` to:
- Skip blockchain service calls (returns fake tx_id)
- Use simplified KYC verification
- Enable console logging for events

### Load Testing

```bash
# Install tools
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:8001
```

## Security Considerations

- 🔐 **PII Encryption**: All PII stored as encrypted pointers
- 🚫 **No Raw Aadhaar**: Never store actual Aadhaar numbers
- 🔑 **Key Management**: Encryption keys via environment variables
- 🛡️ **JWT Security**: Configurable expiry and secret rotation
- 🔒 **RBAC**: Role-based access control integration
- 📝 **Audit Trail**: All operations logged with timestamps

## Production Deployment

### Environment Variables

Required for production:

```bash
# Strong secrets
JWT_SECRET=<generate-strong-32-char-secret>
ENCRYPTION_KEY=<generate-32-byte-key>

# Database with SSL
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?sslmode=require

# External services
BLOCKCHAIN_URL=https://blockchain-service.internal
DASHBOARD_URL=https://dashboard.internal
REDIS_URL=redis://redis-cluster

# Security
USE_KEYCLOAK=true
MOCK_MODE=false
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-onboarding-service
  labels:
    app: auth-onboarding
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-onboarding
  template:
    metadata:
      labels:
        app: auth-onboarding
    spec:
      containers:
      - name: auth-onboarding
        image: tourist-safety/auth-onboarding:latest
        ports:
        - containerPort: 8001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-onboarding-service
spec:
  selector:
    app: auth-onboarding
  ports:
  - port: 80
    targetPort: 8001
  type: LoadBalancer
```

### Health Checks

The service includes comprehensive health checks:

```bash
# Basic health
curl http://localhost:8001/health

# Detailed health with dependencies
curl http://localhost:8001/health/detailed
```

## Performance Optimization

### Database Indexes

```sql
-- Add these indexes for better performance
CREATE INDEX idx_tourists_digital_id ON tourists(digital_id);
CREATE INDEX idx_tourists_issued_at ON tourists(issued_at);
CREATE INDEX idx_sessions_status ON onboarding_sessions(status);
CREATE INDEX idx_sessions_created_at ON onboarding_sessions(created_at);
```

### Connection Pools

```python
# In production, tune these settings
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=1800
)
```

## Monitoring & Observability

### Metrics Endpoints

```bash
# Service metrics (if Prometheus enabled)
curl http://localhost:8001/metrics

# Health metrics
curl http://localhost:8001/health/metrics
```

### Logging

Structured JSON logging for production:

```python
import structlog

logger = structlog.get_logger()
logger.info("Tourist onboarded", 
           digital_id=digital_id, 
           entry_point=entry_point,
           consent_hash=consent_hash[:8])
```

### Error Tracking

Integration with Sentry for error tracking:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()]
)
```

## API Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/onboarding/start")
@limiter.limit("10/minute")
async def start_onboarding(request: Request, ...):
    # Rate limited endpoint
```

## Backup & Recovery

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://tourist-backups/
```

### Disaster Recovery

- Database: PostgreSQL streaming replication
- Storage: MinIO distributed setup with erasure coding
- Redis: Redis Cluster with automatic failover

## License

This project is part of the Smart India Hackathon submission and follows the terms specified by the competition.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-org/auth-onboarding/issues)
- Documentation: [Wiki](https://github.com/your-org/auth-onboarding/wiki)
- Team Contact: sih-team@example.com



# 1. Start everything with Docker
docker-compose up -d

# 2. Check health
curl http://localhost:8001/health

# 3. Run tests
make test

# 4. Try the API
curl -X POST http://localhost:8001/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{"entry_point": "kiosk"}'
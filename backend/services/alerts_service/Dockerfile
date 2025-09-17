FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8005/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]

# .env.example
# Service Configuration
SERVICE_PORT=8005

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/alertsdb

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET=efir-documents

# External Services
BLOCKCHAIN_URL=http://localhost:8003
ML_URL=http://localhost:8002
OPERATOR_URL=http://localhost:8004
DASHBOARD_URL=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_ALGORITHM=HS256

# Feature Flags
USE_FAKE_BLOCKCHAIN=true
INCIDENT_CLUSTER_THRESHOLD=3
INCIDENT_CLUSTER_RADIUS_KM=2.0
INCIDENT_CLUSTER_TIME_WINDOW_HOURS=2
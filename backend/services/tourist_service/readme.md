# Tourist Profile Microservice

The canonical off-chain store for tourist itineraries, preferences, check-ins, and last-known location logic with consent management.

## Features

- **CRUD Operations**: Tourist metadata and itineraries management
- **Check-in System**: Explicit check-ins from hotels, kiosks, or manual entry
- **Consent-based Tracking**: Last-known location only revealed with opt-in or SOS context
- **Offline QR Passes**: Generate encrypted QR tokens for offline access
- **Event Publishing**: Redis events for ML and Dashboard consumers
- **Supabase Integration**: Optional mirroring of tourist summaries

## Data Schema

### Core Tables
- `tourists`: Core tourist profiles with consent flags
- `itineraries`: Travel plans and destinations
- `checkins`: Location check-in records with source tracking
- `hotels`: Hotel registry for check-in integration
- `hotel_checkins`: Hotel-specific check-in records

### Key Features
- **Consent Management**: `opt_in_tracking` flag controls location sharing
- **SOS Override**: Emergency contexts can access coarse location data
- **Source Tracking**: Check-ins tagged by source (hotel/kiosk/manual)
- **Expiration**: Tourist records have configurable expiration dates

## API Endpoints

### Tourist Management
- `POST /tourist` - Create tourist profile
- `GET /tourist/{digital_id}` - Get tourist profile (PII restricted)

### Itineraries
- `POST /itinerary` - Create travel itinerary
- `GET /itineraries/{tourist_id}` - Get all tourist itineraries

### Check-ins
- `POST /checkin` - Record explicit check-in (publishes Redis event)
- `GET /tourist/{digital_id}/last_known` - Get last known location (consent required)

### Offline Access
- `POST /offline_pass` - Generate encrypted QR pass for offline use

### System
- `GET /health` - Service health check

## Event System

### Published Events
- `tourist.checkin`: Published to Redis when check-ins occur
  ```json
  {
    "checkin_id": "uuid",
    "digital_id": "uuid", 
    "tourist_id": "uuid",
    "lat": 40.7128,
    "lng": -74.0060,
    "timestamp": "2025-01-15T10:30:00Z",
    "source": "hotel"
  }
  ```

### Consumed Events
- `tourist.onboarded`: Creates base tourist record from Auth service

## Environment Configuration

### Required Variables
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/touristdb
REDIS_URL=redis://localhost:6379
SERVICE_PORT=8003
JWT_SECRET=your-jwt-secret-key
```

### Optional Variables
```bash
# Supabase Integration (toggle with USE_SUPABASE=true)
USE_SUPABASE=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# MinIO for encrypted PII storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioaccess
MINIO_SECRET_KEY=miniosecret
```

## Supabase Integration

The service can optionally mirror tourist summaries to Supabase for analytics and backup.

### Enable Supabase Mirroring
1. Set environment variables:
   ```bash
   USE_SUPABASE=true
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   ```

2. Create table in Supabase:
   ```sql
   create table tourist_summaries (
     id uuid default gen_random_uuid() primary key,
     tourist_id uuid not null,
     digital_id uuid not null unique,
     opt_in_tracking boolean default false,
     created_at timestamp with time zone not null,
     synced_at timestamp with time zone default now()
   );
   ```

3. Tourist creation will automatically sync to Supabase when enabled

### Disable Supabase Mirroring
Simply set `USE_SUPABASE=false` or remove the environment variable entirely.

## Consent & Privacy Logic

### Last Known Location Access Rules
1. **With Consent**:
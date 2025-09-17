"""
Dashboard Aggregator Microservice
Authority UI Backend - Read-optimized with real-time updates
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import os
from uuid import uuid4

# Configuration
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8006))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/dashboard_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_URL", "http://localhost:8004")
AUTH_URL = os.getenv("AUTH_URL", "http://localhost:8080")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class HeatmapTile(BaseModel):
    tile_id: str
    from_ts: datetime
    to_ts: datetime
    count: int
    avg_risk: float
    top_incident_types: List[str]

class RecentAlert(BaseModel):
    alert_id: str
    timestamp: datetime
    location: Dict[str, float]
    severity: str
    message: str
    incident_type: str

class ActiveIncident(BaseModel):
    incident_id: str
    timestamp: datetime
    location: Dict[str, float]
    status: str
    incident_type: str
    priority: str

class AuditAccess(BaseModel):
    audit_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    service: str
    action: str
    subject_id: Optional[str] = None
    blockchain_tx: Optional[str] = None

class ZoneStatusUpdate(BaseModel):
    zone_id: str
    unsafe: bool
    reason: str

class PIIAccessRequest(BaseModel):
    subject_id: str
    requester_id: str
    purpose: str

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[redis.Redis] = None
scheduler: Optional[AsyncIOScheduler] = None

# Active WebSocket connections
active_connections: List[WebSocket] = []

# Security
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token with Keycloak"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AUTH_URL}/auth/realms/dashboard/protocol/openid_connect/userinfo",
                headers={"Authorization": f"Bearer {credentials.credentials}"}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

async def check_admin_role(user_info: Dict[str, Any]) -> bool:
    """Check if user has admin role"""
    roles = user_info.get("roles", [])
    return "admin" in roles or "dashboard_admin" in roles

# Database operations
async def init_db():
    """Initialize database tables"""
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    
    async with db_pool.acquire() as conn:
        # Heatmap tiles table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS heatmap_tiles (
                tile_id VARCHAR PRIMARY KEY,
                from_ts TIMESTAMP NOT NULL,
                to_ts TIMESTAMP NOT NULL,
                count INTEGER DEFAULT 0,
                avg_risk FLOAT DEFAULT 0.0,
                top_incident_types JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Recent alerts cache table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS recent_alerts (
                alert_id VARCHAR PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL,
                location JSONB NOT NULL,
                severity VARCHAR NOT NULL,
                message TEXT,
                incident_type VARCHAR,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Active incidents table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS active_incidents (
                incident_id VARCHAR PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL,
                location JSONB NOT NULL,
                status VARCHAR NOT NULL,
                incident_type VARCHAR,
                priority VARCHAR,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Audit access table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_access (
                audit_id VARCHAR PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL,
                user_id VARCHAR NOT NULL,
                service VARCHAR NOT NULL,
                action VARCHAR NOT NULL,
                subject_id VARCHAR,
                blockchain_tx VARCHAR,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Create indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_heatmap_tiles_time ON heatmap_tiles(from_ts, to_ts)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_recent_alerts_time ON recent_alerts(timestamp)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_active_incidents_status ON active_incidents(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_access_time ON audit_access(timestamp)")

async def get_heatmap_tiles(from_time: datetime, to_time: datetime) -> List[HeatmapTile]:
    """Get heatmap tiles for time range"""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT tile_id, from_ts, to_ts, count, avg_risk, top_incident_types
            FROM heatmap_tiles
            WHERE from_ts >= $1 AND to_ts <= $2
            ORDER BY tile_id
        """, from_time, to_time)
        
        return [HeatmapTile(
            tile_id=row['tile_id'],
            from_ts=row['from_ts'],
            to_ts=row['to_ts'],
            count=row['count'],
            avg_risk=row['avg_risk'],
            top_incident_types=row['top_incident_types']
        ) for row in rows]

async def get_recent_alerts(limit: int = 50) -> List[RecentAlert]:
    """Get recent alerts"""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT alert_id, timestamp, location, severity, message, incident_type
            FROM recent_alerts
            ORDER BY timestamp DESC
            LIMIT $1
        """, limit)
        
        return [RecentAlert(
            alert_id=row['alert_id'],
            timestamp=row['timestamp'],
            location=row['location'],
            severity=row['severity'],
            message=row['message'],
            incident_type=row['incident_type']
        ) for row in rows]

async def get_active_incidents() -> List[ActiveIncident]:
    """Get active incidents"""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT incident_id, timestamp, location, status, incident_type, priority
            FROM active_incidents
            WHERE status IN ('active', 'investigating', 'escalated')
            ORDER BY priority DESC, timestamp DESC
        """)
        
        return [ActiveIncident(
            incident_id=row['incident_id'],
            timestamp=row['timestamp'],
            location=row['location'],
            status=row['status'],
            incident_type=row['incident_type'],
            priority=row['priority']
        ) for row in rows]

async def store_audit_access(audit: AuditAccess):
    """Store audit access record"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO audit_access (audit_id, timestamp, user_id, service, action, subject_id, blockchain_tx)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, audit.audit_id, audit.timestamp, audit.user_id, audit.service, 
            audit.action, audit.subject_id, audit.blockchain_tx)

# Redis event handling
async def redis_listener():
    """Listen to Redis pub/sub events"""
    global redis_client
    
    channels = [
        'tourist.checkin',
        'alert.created',
        'incident.created',
        'risk.updated',
        'blockchain.tx.confirmed'
    ]
    
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(*channels)
    
    logger.info(f"Subscribed to Redis channels: {channels}")
    
    async for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                channel = message['channel'].decode('utf-8')
                data = json.loads(message['data'].decode('utf-8'))
                await handle_redis_event(channel, data)
            except Exception as e:
                logger.error(f"Error processing Redis message: {e}")

async def handle_redis_event(channel: str, data: Dict[str, Any]):
    """Handle incoming Redis events"""
    logger.info(f"Received event from {channel}: {data}")
    
    try:
        if channel == 'alert.created':
            await handle_alert_created(data)
        elif channel == 'incident.created':
            await handle_incident_created(data)
        elif channel == 'tourist.checkin':
            await handle_tourist_checkin(data)
        elif channel == 'risk.updated':
            await handle_risk_updated(data)
        elif channel == 'blockchain.tx.confirmed':
            await handle_blockchain_confirmed(data)
        
        # Broadcast to WebSocket clients
        ws_message = WebSocketMessage(type=channel.replace('.', '_'), data=data)
        await broadcast_to_websockets(ws_message.dict())
        
    except Exception as e:
        logger.error(f"Error handling {channel} event: {e}")

async def handle_alert_created(data: Dict[str, Any]):
    """Handle new alert creation"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO recent_alerts (alert_id, timestamp, location, severity, message, incident_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (alert_id) DO UPDATE SET
                timestamp = EXCLUDED.timestamp,
                location = EXCLUDED.location,
                severity = EXCLUDED.severity,
                message = EXCLUDED.message,
                incident_type = EXCLUDED.incident_type
        """, data['alert_id'], datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')),
             json.dumps(data['location']), data['severity'], data.get('message', ''), data.get('incident_type', ''))

async def handle_incident_created(data: Dict[str, Any]):
    """Handle new incident creation"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO active_incidents (incident_id, timestamp, location, status, incident_type, priority)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (incident_id) DO UPDATE SET
                timestamp = EXCLUDED.timestamp,
                location = EXCLUDED.location,
                status = EXCLUDED.status,
                incident_type = EXCLUDED.incident_type,
                priority = EXCLUDED.priority,
                updated_at = NOW()
        """, data['incident_id'], datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')),
             json.dumps(data['location']), data['status'], data.get('incident_type', ''), data.get('priority', 'medium'))

async def handle_tourist_checkin(data: Dict[str, Any]):
    """Handle tourist check-in for heatmap updates"""
    # This could trigger immediate heatmap tile updates if needed
    # For now, we'll let the hourly job handle it
    pass

async def handle_risk_updated(data: Dict[str, Any]):
    """Handle risk level updates"""
    # Could update incident priorities or create alerts
    pass

async def handle_blockchain_confirmed(data: Dict[str, Any]):
    """Handle blockchain transaction confirmations"""
    # Update audit records with confirmed transaction hashes
    if 'audit_id' in data:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE audit_access SET blockchain_tx = $1 WHERE audit_id = $2
            """, data.get('tx_hash'), data['audit_id'])

# WebSocket management
async def broadcast_to_websockets(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients"""
    if not active_connections:
        return
    
    message_json = json.dumps(message, default=str)
    disconnected = []
    
    for connection in active_connections:
        try:
            await connection.send_text(message_json)
        except WebSocketDisconnect:
            disconnected.append(connection)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            disconnected.append(connection)
    
    # Remove disconnected clients
    for connection in disconnected:
        active_connections.remove(connection)

# Background tasks
async def compute_heatmap_tiles():
    """Periodic task to compute heatmap tiles from raw data"""
    logger.info("Starting heatmap tile computation")
    
    try:
        # Simple grid aggregation - you can customize the tile size and logic
        current_time = datetime.utcnow()
        from_time = current_time - timedelta(hours=24)  # Last 24 hours
        
        async with db_pool.acquire() as conn:
            # This is a simplified example - you'll need to adapt based on your data structure
            # Assuming you have a checkins or events table to aggregate from
            
            # Create tiles based on location buckets (simplified lat/lon grid)
            await conn.execute("""
                INSERT INTO heatmap_tiles (tile_id, from_ts, to_ts, count, avg_risk, top_incident_types)
                SELECT 
                    CONCAT(
                        FLOOR((location->>'lat')::float / 0.01)::text, '_',
                        FLOOR((location->>'lon')::float / 0.01)::text
                    ) as tile_id,
                    $1 as from_ts,
                    $2 as to_ts,
                    COUNT(*) as count,
                    AVG(COALESCE((data->>'risk_level')::float, 0.5)) as avg_risk,
                    ARRAY_AGG(DISTINCT incident_type) FILTER (WHERE incident_type IS NOT NULL) as top_incident_types
                FROM recent_alerts 
                WHERE timestamp >= $1 AND timestamp < $2
                GROUP BY tile_id
                ON CONFLICT (tile_id) DO UPDATE SET
                    count = EXCLUDED.count,
                    avg_risk = EXCLUDED.avg_risk,
                    top_incident_types = EXCLUDED.top_incident_types,
                    updated_at = NOW()
            """, from_time, current_time)
            
        logger.info("Heatmap tile computation completed")
        
    except Exception as e:
        logger.error(f"Error in heatmap computation: {e}")

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    global redis_client, scheduler
    
    # Startup
    logger.info("Starting Dashboard Aggregator Service")
    
    # Initialize database
    await init_db()
    
    # Initialize Redis
    redis_client = redis.from_url(REDIS_URL)
    
    # Start background scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        compute_heatmap_tiles,
        CronTrigger(minute=0),  # Run every hour
        id='heatmap_computation'
    )
    scheduler.start()
    
    # Start Redis listener
    asyncio.create_task(redis_listener())
    
    logger.info(f"Dashboard Aggregator started on port {SERVICE_PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Dashboard Aggregator Service")
    if scheduler:
        scheduler.shutdown()
    if redis_client:
        await redis_client.close()
    if db_pool:
        await db_pool.close()

# FastAPI app
app = FastAPI(
    title="Dashboard Aggregator",
    description="Read-optimized dashboard backend with real-time updates",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dashboard-aggregator", "port": SERVICE_PORT}

# WebSocket endpoint
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info("WebSocket client connected")
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")

# Dashboard data endpoints
@app.get("/api/dashboard/heatmap")
async def get_heatmap(
    hours: int = 24,
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Get heatmap tiles for the specified time range"""
    to_time = datetime.utcnow()
    from_time = to_time - timedelta(hours=hours)
    
    tiles = await get_heatmap_tiles(from_time, to_time)
    return {"tiles": [tile.dict() for tile in tiles]}

@app.get("/api/dashboard/alerts")
async def get_alerts(
    limit: int = 50,
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Get recent alerts"""
    alerts = await get_recent_alerts(limit)
    return {"alerts": [alert.dict() for alert in alerts]}

@app.get("/api/dashboard/incidents")
async def get_incidents(
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Get active incidents"""
    incidents = await get_active_incidents()
    return {"incidents": [incident.dict() for incident in incidents]}

@app.get("/api/dashboard/audit")
async def get_audit_logs(
    limit: int = 100,
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Get audit access logs (admin only)"""
    if not await check_admin_role(user_info):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT audit_id, timestamp, user_id, service, action, subject_id, blockchain_tx
            FROM audit_access
            ORDER BY timestamp DESC
            LIMIT $1
        """, limit)
        
        return {"audit_logs": [dict(row) for row in rows]}

# Admin actions
@app.post("/api/admin/zone/status")
async def update_zone_status(
    zone_update: ZoneStatusUpdate,
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Mark zone as unsafe (proxy to ML service)"""
    if not await check_admin_role(user_info):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Log audit entry
    audit = AuditAccess(
        user_id=user_info['sub'],
        service='zone_management',
        action=f"mark_zone_{'unsafe' if zone_update.unsafe else 'safe'}",
        subject_id=zone_update.zone_id
    )
    await store_audit_access(audit)
    
    # Proxy to ML service or Tourist Profile service
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{os.getenv('ML_SERVICE_URL', 'http://localhost:8002')}/api/zones/{zone_update.zone_id}/status",
            json=zone_update.dict()
        )
        
        if response.status_code == 200:
            return {"success": True, "audit_id": audit.audit_id}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to update zone status")

@app.post("/api/admin/pii/access")
async def approve_pii_access(
    access_request: PIIAccessRequest,
    user_info: Dict[str, Any] = Depends(verify_token)
):
    """Approve PII access request (proxy to relevant service)"""
    if not await check_admin_role(user_info):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Log audit entry
    audit = AuditAccess(
        user_id=user_info['sub'],
        service='pii_access',
        action='approve_access',
        subject_id=access_request.subject_id
    )
    await store_audit_access(audit)
    
    # Optionally anchor to blockchain
    try:
        async with httpx.AsyncClient() as client:
            blockchain_response = await client.post(
                f"{BLOCKCHAIN_URL}/api/audit/anchor",
                json={"audit_id": audit.audit_id, "data": audit.dict()}
            )
            if blockchain_response.status_code == 200:
                tx_data = blockchain_response.json()
                audit.blockchain_tx = tx_data.get('tx_hash')
    except Exception as e:
        logger.warning(f"Failed to anchor audit to blockchain: {e}")
    
    # Update audit record with blockchain tx if available
    if audit.blockchain_tx:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE audit_access SET blockchain_tx = $1 WHERE audit_id = $2
            """, audit.blockchain_tx, audit.audit_id)
    
    # Proxy to appropriate service (Alerts or Tourist Profile)
    service_url = f"{os.getenv('TOURIST_PROFILE_URL', 'http://localhost:8001')}/api/pii/access"
    async with httpx.AsyncClient() as client:
        response = await client.post(service_url, json=access_request.dict())
        
        if response.status_code == 200:
            return {
                "success": True, 
                "audit_id": audit.audit_id,
                "blockchain_tx": audit.blockchain_tx
            }
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to approve PII access")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
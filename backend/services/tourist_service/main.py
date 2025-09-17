from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
import os
import json
from datetime import datetime, timedelta
from typing import Optional, List
import uuid

from database import get_db, init_db
from models import Tourist, Itinerary, Checkin, Hotel, HotelCheckin
from schemas import (
    TouristCreate, TouristResponse, ItineraryCreate, ItineraryResponse,
    CheckinCreate, CheckinResponse, OfflinePassRequest, OfflinePassResponse,
    LastKnownRequest, LastKnownResponse
)
from services.redis_service import RedisService
from services.qr_service import QRService
from services.supabase_service import SupabaseService
from services.cache_service import CacheService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await RedisService.initialize()
    await CacheService.initialize()
    yield
    # Shutdown
    await RedisService.close()

app = FastAPI(
    title="Tourist Profile Service",
    description="CRUD for tourist metadata, itineraries, and location tracking",
    version="1.0.0",
    lifespan=lifespan
)

security = HTTPBearer()

# Dependency for auth validation (simplified)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In real implementation, validate JWT token
    return {"user_id": "system", "roles": ["tourist"]}

@app.post("/tourist", response_model=TouristResponse)
async def create_tourist(
    tourist: TouristCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create new tourist profile"""
    db_tourist = Tourist(
        tourist_id=uuid.uuid4(),
        digital_id=tourist.digital_id,
        name_pointer=tourist.name_pointer,
        opt_in_tracking=tourist.opt_in_tracking,
        created_at=datetime.utcnow(),
        expires_at=tourist.expires_at
    )
    
    db.add(db_tourist)
    await db.commit()
    await db.refresh(db_tourist)
    
    # Mirror to Supabase if enabled
    if os.getenv("USE_SUPABASE", "false").lower() == "true":
        await SupabaseService.create_tourist_summary(db_tourist)
    
    return TouristResponse.from_orm(db_tourist)

@app.get("/tourist/{digital_id}", response_model=TouristResponse)
async def get_tourist(
    digital_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get tourist profile (no raw PII unless authorized)"""
    tourist = await db.get(Tourist, digital_id)
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    
    # In real implementation, check authorization for PII access
    return TouristResponse.from_orm(tourist)

@app.post("/itinerary", response_model=ItineraryResponse)
async def create_itinerary(
    itinerary: ItineraryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create new itinerary"""
    db_itinerary = Itinerary(
        id=uuid.uuid4(),
        tourist_id=itinerary.tourist_id,
        place_name=itinerary.place_name,
        geojson=itinerary.geojson,
        start_ts=itinerary.start_ts,
        end_ts=itinerary.end_ts
    )
    
    db.add(db_itinerary)
    await db.commit()
    await db.refresh(db_itinerary)
    
    return ItineraryResponse.from_orm(db_itinerary)

@app.get("/itineraries/{tourist_id}", response_model=List[ItineraryResponse])
async def get_itineraries(
    tourist_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all itineraries for a tourist"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Itinerary).where(Itinerary.tourist_id == tourist_id)
    )
    itineraries = result.scalars().all()
    
    return [ItineraryResponse.from_orm(itinerary) for itinerary in itineraries]

@app.post("/checkin", response_model=CheckinResponse)
async def create_checkin(
    checkin: CheckinCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create explicit check-in and publish event"""
    # Verify tourist exists
    tourist = await db.get(Tourist, checkin.tourist_id)
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    
    db_checkin = Checkin(
        checkin_id=uuid.uuid4(),
        tourist_id=checkin.tourist_id,
        digital_id=checkin.digital_id,
        lat=checkin.lat,
        lng=checkin.lng,
        source=checkin.source,
        timestamp=checkin.timestamp or datetime.utcnow()
    )
    
    db.add(db_checkin)
    await db.commit()
    await db.refresh(db_checkin)
    
    # Update cache with last known location
    await CacheService.update_last_known(
        checkin.digital_id,
        {
            "lat": checkin.lat,
            "lng": checkin.lng,
            "timestamp": db_checkin.timestamp.isoformat(),
            "source": checkin.source
        }
    )
    
    # Publish Redis event
    event_payload = {
        "checkin_id": str(db_checkin.checkin_id),
        "digital_id": str(db_checkin.digital_id),
        "tourist_id": str(db_checkin.tourist_id),
        "lat": db_checkin.lat,
        "lng": db_checkin.lng,
        "timestamp": db_checkin.timestamp.isoformat(),
        "source": db_checkin.source
    }
    
    await RedisService.publish_event("tourist.checkin", event_payload)
    
    return CheckinResponse.from_orm(db_checkin)

@app.get("/tourist/{digital_id}/last_known", response_model=Optional[LastKnownResponse])
async def get_last_known(
    digital_id: uuid.UUID,
    incident_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get last known location (consent & authorization required)"""
    # Get tourist
    from sqlalchemy import select
    result = await db.execute(
        select(Tourist).where(Tourist.digital_id == digital_id)
    )
    tourist = result.scalar_one_or_none()
    
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    
    # Check authorization
    is_sos_context = incident_id is not None  # SOS if incident_id provided
    has_consent = tourist.opt_in_tracking
    
    if not (has_consent or is_sos_context):
        return None
    
    # Get from cache first
    last_known = await CacheService.get_last_known(digital_id)
    if last_known:
        if not has_consent and is_sos_context:
            # Return coarse-grained data for SOS
            return LastKnownResponse(
                digital_id=digital_id,
                lat=round(last_known["lat"], 2),  # Coarse location
                lng=round(last_known["lng"], 2),
                timestamp=last_known["timestamp"],
                source=last_known["source"],
                precision="coarse"
            )
        else:
            return LastKnownResponse(
                digital_id=digital_id,
                lat=last_known["lat"],
                lng=last_known["lng"],
                timestamp=last_known["timestamp"],
                source=last_known["source"],
                precision="precise"
            )
    
    # Fallback to database
    result = await db.execute(
        select(Checkin)
        .where(Checkin.digital_id == digital_id)
        .order_by(Checkin.timestamp.desc())
        .limit(1)
    )
    latest_checkin = result.scalar_one_or_none()
    
    if not latest_checkin:
        return None
    
    precision = "precise" if has_consent else "coarse"
    lat = latest_checkin.lat if has_consent else round(latest_checkin.lat, 2)
    lng = latest_checkin.lng if has_consent else round(latest_checkin.lng, 2)
    
    return LastKnownResponse(
        digital_id=digital_id,
        lat=lat,
        lng=lng,
        timestamp=latest_checkin.timestamp.isoformat(),
        source=latest_checkin.source,
        precision=precision
    )

@app.post("/offline_pass", response_model=OfflinePassResponse)
async def generate_offline_pass(
    request: OfflinePassRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate offline QR pass with encrypted pointer"""
    # Verify tourist exists
    tourist = await db.get(Tourist, request.tourist_id)
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    
    # Generate pass
    pass_data = await QRService.generate_offline_pass(
        tourist_id=request.tourist_id,
        digital_id=tourist.digital_id,
        pii_pointer=tourist.name_pointer,
        expires_in_hours=request.expires_in_hours or 24
    )
    
    return OfflinePassResponse(
        pass_token=pass_data["token"],
        qr_code_url=pass_data["qr_url"],
        expires_at=pass_data["expires_at"]
    )

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "tourist-profile",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("SERVICE_PORT", 8003)))

# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/touristdb")

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    from models import Tourist, Itinerary, Checkin, Hotel, HotelCheckin
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
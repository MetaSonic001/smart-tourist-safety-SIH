from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, ForeignKey, Enum
from datetime import datetime
from typing import List, Optional
import enum

engine = create_async_engine(settings.database_url)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class AlertSource(enum.Enum):
    APP = "app"
    SMS = "sms"
    IOT = "iot"

class AlertStatus(enum.Enum):
    RECEIVED = "received"
    PROCESSED = "processed"
    ESCALATED = "escalated"

class IncidentStatus(enum.Enum):
    RECEIVED = "received"
    ACKNOWLEDGED = "acknowledged"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(String, primary_key=True)
    digital_id = Column(String, nullable=True)
    tourist_id = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    source = Column(Enum(AlertSource), nullable=False)
    media_refs = Column(JSON, default=list)
    status = Column(Enum(AlertStatus), default=AlertStatus.RECEIVED)
    created_at = Column(DateTime, default=datetime.utcnow)
    incident_id = Column(String, ForeignKey("incidents.incident_id"), nullable=True)

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String, primary_key=True)
    alerts = Column(JSON, default=list)  # List of alert_ids
    priority = Column(Integer, default=1)
    assigned_unit = Column(String, nullable=True)
    efir_pointer = Column(String, nullable=True)  # MinIO object key
    efir_hash = Column(String, nullable=True)     # SHA256 hash
    blockchain_tx_id = Column(String, nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.RECEIVED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
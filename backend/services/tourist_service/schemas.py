from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from models import CheckinSource

class TouristCreate(BaseModel):
    digital_id: uuid.UUID
    name_pointer: Optional[str] = None
    opt_in_tracking: bool = False
    expires_at: Optional[datetime] = None

class TouristResponse(BaseModel):
    tourist_id: uuid.UUID
    digital_id: uuid.UUID
    opt_in_tracking: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ItineraryCreate(BaseModel):
    tourist_id: uuid.UUID
    place_name: str
    geojson: Optional[Dict[str, Any]] = None
    start_ts: Optional[datetime] = None
    end_ts: Optional[datetime] = None

class ItineraryResponse(BaseModel):
    id: uuid.UUID
    tourist_id: uuid.UUID
    place_name: str
    geojson: Optional[Dict[str, Any]] = None
    start_ts: Optional[datetime] = None
    end_ts: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CheckinCreate(BaseModel):
    tourist_id: uuid.UUID
    digital_id: uuid.UUID
    lat: float
    lng: float
    source: CheckinSource
    timestamp: Optional[datetime] = None

class CheckinResponse(BaseModel):
    checkin_id: uuid.UUID
    tourist_id: uuid.UUID
    digital_id: uuid.UUID
    lat: float
    lng: float
    source: CheckinSource
    timestamp: datetime
    
    class Config:
        from_attributes = True

class LastKnownRequest(BaseModel):
    incident_id: Optional[str] = None

class LastKnownResponse(BaseModel):
    digital_id: uuid.UUID
    lat: float
    lng: float
    timestamp: str
    source: CheckinSource
    precision: str  # "precise" or "coarse"

class OfflinePassRequest(BaseModel):
    tourist_id: uuid.UUID
    expires_in_hours: Optional[int] = 24

class OfflinePassResponse(BaseModel):
    pass_token: str
    qr_code_url: str
    expires_at: datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.database import AlertSource, AlertStatus, IncidentStatus

class SOSAlertCreate(BaseModel):
    alert_id: str
    digital_id: Optional[str] = None
    tourist_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    timestamp: datetime
    source: AlertSource
    media_refs: List[str] = Field(default_factory=list)

class AlertResponse(BaseModel):
    alert_id: str
    digital_id: Optional[str]
    tourist_id: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    source: str
    media_refs: List[str]
    status: str
    created_at: datetime
    incident_id: Optional[str]

class IncidentResponse(BaseModel):
    incident_id: str
    alerts: List[str]
    priority: int
    assigned_unit: Optional[str]
    efir_pointer: Optional[str]
    efir_hash: Optional[str]
    blockchain_tx_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_unit: Optional[str] = None
    priority: Optional[int] = None
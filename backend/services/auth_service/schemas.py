from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    POLICE = "police"
    TOURISM_OFFICER = "tourism_officer"
    OPERATOR_112 = "operator_112"
    HOTEL = "hotel"
    TOURIST = "tourist"

class EntryPoint(str, Enum):
    KIOSK = "kiosk"
    APP = "app"
    HOTEL = "hotel"
    AIRPORT_KIOSK = "airport_kiosk"
    RAILWAY_KIOSK = "railway_kiosk"

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.TOURIST
    phone: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    full_name: str
    role: UserRole
    created_at: datetime
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: UserRole

class OnboardingStart(BaseModel):
    entry_point: EntryPoint
    device_id: Optional[str] = None
    location: Optional[Dict[str, Any]] = None

class SessionResponse(BaseModel):
    session_id: str
    entry_point: EntryPoint
    status: str
    created_at: datetime

class KYCResponse(BaseModel):
    session_id: str
    kyc_verified: bool
    pii_pointer: str
    message: str

class OnboardingFinalize(BaseModel):
    trip_end_date: Optional[datetime] = None
    opt_in_tracking: bool = True
    emergency_contact: Optional[Dict[str, str]] = None

class OnboardingComplete(BaseModel):
    tourist_id: str
    digital_id: str
    consent_hash: str
    issued_at: str
    expires_at: str
    tx_id: str
    entry_point: str
    status: str = "completed"

class SessionStatus(BaseModel):
    session_id: str
    status: str
    entry_point: EntryPoint
    created_at: datetime
    updated_at: Optional[datetime] = None

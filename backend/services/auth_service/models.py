import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Tourist(Base):
    __tablename__ = "tourists"
    
    tourist_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    digital_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    pii_pointer = Column(Text, nullable=False)  # encrypted pointer to MinIO
    consent_hash = Column(String(64), nullable=False)  # SHA256 hex
    issued_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    opt_in_tracking = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    blockchain_tx_id = Column(String(100), nullable=True)
    entry_point = Column(String(50), nullable=False)
    
    def __repr__(self):
        return f"<Tourist {self.digital_id}>"

class OnboardingSession(Base):
    __tablename__ = "onboarding_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_point = Column(String(50), nullable=False)
    status = Column(String(20), default="started")  # started, kyc_submitted, completed
    device_id = Column(String(100), nullable=True)
    location_data = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    tourist_id = Column(UUID(as_uuid=True), nullable=True)
    
    def __repr__(self):
        return f"<OnboardingSession {self.session_id}>"

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=True)  # null if using Keycloak
    role = Column(String(20), nullable=False, default="tourist")
    phone = Column(String(20), nullable=True)
    keycloak_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<User {self.username}>"

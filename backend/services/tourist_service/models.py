from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Enum, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum

class CheckinSource(enum.Enum):
    hotel = "hotel"
    kiosk = "kiosk"
    manual = "manual"

class Tourist(Base):
    __tablename__ = "tourists"
    
    tourist_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    digital_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    name_pointer = Column(Text)  # S3 path to encrypted name
    opt_in_tracking = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime)
    
    itineraries = relationship("Itinerary", back_populates="tourist")
    checkins = relationship("Checkin", back_populates="tourist")

class Itinerary(Base):
    __tablename__ = "itineraries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tourist_id = Column(UUID(as_uuid=True), ForeignKey("tourists.tourist_id"))
    place_name = Column(String(255))
    geojson = Column(JSON)
    start_ts = Column(DateTime)
    end_ts = Column(DateTime)
    
    tourist = relationship("Tourist", back_populates="itineraries")

class Checkin(Base):
    __tablename__ = "checkins"
    
    checkin_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tourist_id = Column(UUID(as_uuid=True), ForeignKey("tourists.tourist_id"))
    digital_id = Column(UUID(as_uuid=True), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    source = Column(Enum(CheckinSource), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    
    tourist = relationship("Tourist", back_populates="checkins")

class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    api_key = Column(String(255))
    lat = Column(Float)
    lng = Column(Float)

class HotelCheckin(Base):
    __tablename__ = "hotel_checkins"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.id"))
    digital_id = Column(UUID(as_uuid=True), nullable=False)
    checkin_time = Column(DateTime, nullable=False)
    checkout_time = Column(DateTime)
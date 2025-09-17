"""Database setup script for development"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from database import Base
from models import Tourist, Itinerary, Checkin, Hotel, HotelCheckin

async def create_tables():
    """Create all database tables"""
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/touristdb")
    engine = create_async_engine(database_url)
    
    async with engine.begin() as conn:
        # Drop all tables (development only!)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")
    
    await engine.dispose()

async def seed_data():
    """Seed database with sample data"""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    from datetime import datetime, timedelta
    import uuid
    
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/touristdb")
    engine = create_async_engine(database_url)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Create sample tourist
        tourist = Tourist(
            tourist_id=uuid.uuid4(),
            digital_id=uuid.uuid4(),
            name_pointer="s3://pii-bucket/encrypted/sample.dat",
            opt_in_tracking=True,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        session.add(tourist)
        
        # Create sample hotel
        hotel = Hotel(
            id=uuid.uuid4(),
            name="Sample Hotel",
            api_key="hotel-api-key-123",
            lat=40.7128,
            lng=-74.0060
        )
        session.add(hotel)
        
        await session.commit()
        print("Sample data seeded successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
    asyncio.run(seed_data())
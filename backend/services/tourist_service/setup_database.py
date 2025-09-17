# setup_database.py (place in root directory)
"""Simple database setup - place in root directory alongside main.py"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from database import Base
from models import Tourist, Itinerary, Checkin, Hotel, HotelCheckin

async def setup_database():
    """Setup database tables"""
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/touristdb")
    print(f"🔌 Connecting to: postgresql+asyncpg://postgres:***@localhost:5432/touristdb")
    
    engine = create_async_engine(database_url)
    
    try:
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created successfully!")
        
        print("🎉 Database setup completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Make sure PostgreSQL is running:")
        print("   docker-compose up -d postgres")
        
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup_database())
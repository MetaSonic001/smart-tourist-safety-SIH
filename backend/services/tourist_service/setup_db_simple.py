# setup_db_simple.py
"""Simple database setup with better error handling"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from database import Base
from models import Tourist, Itinerary, Checkin, Hotel, HotelCheckin

async def test_connections():
    """Try different connection strings"""
    
    # Load from .env file if it exists
    env_url = os.getenv("DATABASE_URL")
    
    # Common connection strings to try
    urls_to_try = [
        ("postgresql+asyncpg://postgres:password@localhost:5432/touristdb", "Default localhost"),
        ("postgresql+asyncpg://postgres@localhost:5432/touristdb", "No password"),
        ("postgresql+asyncpg://postgres:postgres@localhost:5432/touristdb", "postgres/postgres"),
    ]
    
    # Add env URL if it exists and fix docker internal hostname
    if env_url:
        # Replace docker hostname with localhost for external access
        fixed_env_url = env_url.replace("@postgres:", "@localhost:")
        urls_to_try.insert(0, (fixed_env_url, "Environment variable (fixed)"))
        urls_to_try.insert(1, (env_url, "Environment variable (original)"))
    
    print("🔍 Testing database connections...")
    
    for url, description in urls_to_try:
        try:
            print(f"\n📡 Trying: {description}")
            print(f"   URL: {url.replace(':password@', ':***@').replace(':postgres@', ':***@')}")
            
            engine = create_async_engine(url)
            async with engine.begin() as conn:
                await conn.execute("SELECT 1")
                print("   ✅ Connection successful!")
                await engine.dispose()
                return url
                
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:80]}...")
            continue
    
    print(f"\n❌ No working connection found!")
    print(f"💡 Make sure PostgreSQL is running:")
    print(f"   docker-compose up -d postgres")
    return None

async def setup_database():
    """Setup database tables"""
    
    # Find working connection
    database_url = await test_connections()
    if not database_url:
        return False
    
    print(f"\n🔧 Setting up database tables...")
    
    try:
        engine = create_async_engine(database_url)
        
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created successfully!")
        
        # Add some sample data
        await add_sample_data(engine)
        
        await engine.dispose()
        print("🎉 Database setup completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False

async def add_sample_data(engine):
    """Add sample data"""
    from sqlalchemy.ext.asyncio import async_sessionmaker
    from datetime import datetime, timedelta
    import uuid
    
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Create sample tourist
        tourist_id = uuid.uuid4()
        digital_id = uuid.uuid4()
        
        tourist = Tourist(
            tourist_id=tourist_id,
            digital_id=digital_id,
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
        
        print("✅ Sample data added:")
        print(f"   🧳 Tourist ID: {tourist_id}")
        print(f"   🔑 Digital ID: {digital_id}")
        print(f"   🏨 Hotel: Sample Hotel")

if __name__ == "__main__":
    print("🚀 Starting database setup...")
    
    success = asyncio.run(setup_database())
    
    if success:
        print(f"\n🎉 All done! You can now run:")
        print(f"   python main.py")
    else:
        print(f"\n❌ Setup failed. Check the errors above.")
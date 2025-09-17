# debug_connection.py
"""Test different database connection strings"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection(connection_string, description):
    """Test a database connection"""
    print(f"\n🔍 Testing: {description}")
    print(f"   URL: {connection_string}")
    
    try:
        engine = create_async_engine(connection_string)
        async with engine.begin() as conn:
            result = await conn.execute("SELECT version()")
            row = result.fetchone()
            print(f"   ✅ SUCCESS! PostgreSQL version: {row[0][:50]}...")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"   ❌ FAILED: {str(e)[:100]}...")
        return False

async def main():
    """Test various connection possibilities"""
    
    # Common connection strings to try
    connections_to_try = [
        ("postgresql+asyncpg://postgres:password@localhost:5432/touristdb", "Default from docker-compose"),
        ("postgresql+asyncpg://postgres@localhost:5432/touristdb", "No password"),
        ("postgresql+asyncpg://postgres:postgres@localhost:5432/touristdb", "Password = postgres"),
        ("postgresql+asyncpg://postgres:123456@localhost:5432/touristdb", "Password = 123456"),
        ("postgresql+asyncpg://postgres:admin@localhost:5432/touristdb", "Password = admin"),
    ]
    
    print("🚀 Testing database connections...")
    
    for conn_str, desc in connections_to_try:
        success = await test_connection(conn_str, desc)
        if success:
            print(f"\n🎉 WORKING CONNECTION FOUND!")
            print(f"Use this in your .env file:")
            print(f"DATABASE_URL={conn_str}")
            break
    else:
        print(f"\n❌ None of the common passwords worked.")
        print(f"Let's check your docker-compose.yml configuration:")
        print(f"1. Look for POSTGRES_PASSWORD in docker-compose.yml")
        print(f"2. Or recreate the container: docker-compose down && docker-compose up -d postgres")

if __name__ == "__main__":
    asyncio.run(main())
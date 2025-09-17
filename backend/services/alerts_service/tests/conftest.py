import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.database import Base, get_db
from app.main import app
from fastapi.testclient import TestClient
import os

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

@pytest_asyncio.fixture
async def test_db():
    # Create test engine
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async def get_test_db():
        async with async_session() as session:
            yield session
    
    # Override dependency
    app.dependency_overrides[get_db] = get_test_db
    
    yield async_session
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
def client():
    return TestClient(app)

# tests/test_alerts.py
import pytest
from datetime import datetime
from app.database import AlertSource

@pytest.mark.asyncio
async def test_create_sos_alert(client, test_db):
    """Test SOS alert creation"""
    alert_data = {
        "alert_id": "test_alert_001",
        "digital_id": "DID123456",
        "tourist_id": "TID789",
        "lat": 19.0760,
        "lng": 72.8777,
        "timestamp": datetime.utcnow().isoformat(),
        "source": "app",
        "media_refs": ["image1.jpg", "audio1.mp3"]
    }
    
    # Mock JWT token
    headers = {"Authorization": "Bearer fake_token"}
    
    with pytest.patch('app.auth.verify_token', return_value={"user_id": "test_user", "role": "user"}):
        response = client.post("/alerts/sos", json=alert_data, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["alert_id"] == alert_data["alert_id"]
    assert data["digital_id"] == alert_data["digital_id"]
    assert data["source"] == "app"
    assert data["status"] == "processed"

@pytest.mark.asyncio 
async def test_clustering_logic(client, test_db):
    """Test incident creation through clustering"""
    # Create multiple alerts in same area
    base_lat, base_lng = 19.0760, 72.8777
    
    alerts = []
    for i in range(3):  # Should trigger clustering
        alert_data = {
            "alert_id": f"cluster_alert_{i}",
            "digital_id": f"DID{i}",
            "lat": base_lat + (i * 0.001),  # Very close coordinates
            "lng": base_lng + (i * 0.001),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "app",
            "media_refs": []
        }
        alerts.append(alert_data)
    
    headers = {"Authorization": "Bearer fake_token"}
    
    with pytest.patch('app.auth.verify_token', return_value={"user_id": "test_user", "role": "user"}):
        responses = []
        for alert_data in alerts:
            response = client.post("/alerts/sos", json=alert_data, headers=headers)
            responses.append(response)
    
    # Check that at least one alert triggered incident creation
    incident_created = any(r.json().get("incident_id") for r in responses)
    assert incident_created, "Expected clustering to create an incident"

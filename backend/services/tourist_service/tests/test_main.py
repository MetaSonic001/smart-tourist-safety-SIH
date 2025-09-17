import pytest
import asyncio
from httpx import AsyncClient
from main import app
import uuid
from datetime import datetime

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.mark.asyncio
async def test_create_tourist():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        tourist_data = {
            "digital_id": str(uuid.uuid4()),
            "name_pointer": "s3://bucket/encrypted_name.dat",
            "opt_in_tracking": True
        }
        
        response = await ac.post("/tourist", json=tourist_data)
        assert response.status_code == 200
        data = response.json()
        assert data["digital_id"] == tourist_data["digital_id"]
        assert data["opt_in_tracking"] == True

@pytest.mark.asyncio
async def test_checkin_and_event():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # First create a tourist
        tourist_data = {
            "digital_id": str(uuid.uuid4()),
            "opt_in_tracking": True
        }
        tourist_response = await ac.post("/tourist", json=tourist_data)
        tourist = tourist_response.json()
        
        # Create checkin
        checkin_data = {
            "tourist_id": tourist["tourist_id"],
            "digital_id": tourist["digital_id"],
            "lat": 40.7128,
            "lng": -74.0060,
            "source": "manual"
        }
        
        response = await ac.post("/checkin", json=checkin_data)
        assert response.status_code == 200
        data = response.json()
        assert data["lat"] == 40.7128
        assert data["lng"] == -74.0060
        assert data["source"] == "manual"

@pytest.mark.asyncio
async def test_last_known_consent_logic():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create tourist with opt_in_tracking = False
        digital_id = str(uuid.uuid4())
        tourist_data = {
            "digital_id": digital_id,
            "opt_in_tracking": False
        }
        tourist_response = await ac.post("/tourist", json=tourist_data)
        tourist = tourist_response.json()
        
        # Try to get last_known without consent or SOS
        response = await ac.get(f"/tourist/{digital_id}/last_known")
        assert response.status_code == 200
        assert response.json() is None  # Should return null
        
        # Try with SOS context (incident_id)
        response = await ac.get(f"/tourist/{digital_id}/last_known?incident_id=emergency-123")
        # Should return coarse data even without consent in SOS context
        # (would need checkin data first for actual test)

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "tourist-profile"
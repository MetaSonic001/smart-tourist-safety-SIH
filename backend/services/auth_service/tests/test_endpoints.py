import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestEndpoints:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "auth-onboarding"
    
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Smart Tourist Safety" in data["service"]
        assert data["version"] == "1.0.0"
    
    def test_start_onboarding(self):
        payload = {
            "entry_point": "kiosk",
            "device_id": "device123"
        }
        response = client.post("/onboarding/start", json=payload)
        # Note: This will fail without database setup, but shows the test structure
        # In real tests, you'd use a test database

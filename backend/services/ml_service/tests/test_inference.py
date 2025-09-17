import pytest
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

def test_zone_score():
    payload = {
        "polygon_id": "zone1",
        "polygon_geojson": {"type": "Polygon", "coordinates": []},
        "recent_incident_counts": 3,
        "crowd_density": 0.5,
        "police_activity_score": 0.6,
        "weather_flags": ["sunny"],
        "social_sentiment_score": 0.7
    }
    response = client.post("/ml/zone_score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["zone_risk_score"] <= 1
    assert data["risk_label"] in ["low", "medium", "high"]

def test_summarize_incident():
    payload = {"text_or_transcript": "This is a test incident description."}
    response = client.post("/ml/summarize_incident", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["summary"]) > 0

# Add more tests for other endpoints...
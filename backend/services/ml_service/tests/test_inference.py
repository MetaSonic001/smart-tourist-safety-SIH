import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from app import app

client = TestClient(app)

# Sample payloads for reuse
zone_payload = {
    "polygon_id": "zone1",
    "polygon_geojson": {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 0]]]},
    "recent_incident_counts": 3,
    "crowd_density": 0.5,
    "police_activity_score": 0.6,
    "weather_flags": ["sunny"],
    "social_sentiment_score": 0.7
}

individual_payload = {
    "digital_id": "user1",
    "features": {
        "age_group": "adult",
        "solo_travel_bool": True,
        "health_flags": ["allergy"],
        "last_checkins": [{"lat": 40.71, "lng": -74.01, "timestamp": "2025-09-18T00:00:00Z"}],
        "itinerary_features": {"destination": "city"},
        "recent_incident_counts": 2
    }
}

anomaly_payload = {
    "digital_id": "user1",
    "trajectory_points": [
        {"lat": 40.71, "lng": -74.01, "timestamp": "2025-09-18T00:00:00Z"},
        {"lat": 40.72, "lng": -74.02, "timestamp": "2025-09-18T00:01:00Z"},
        {"lat": 40.73, "lng": -74.03, "timestamp": "2025-09-18T00:02:00Z"}
    ]
}

summarize_payload = {
    "text_or_transcript": "Emergency incident reported at downtown area involving a minor collision."
}

ingest_payload = {
    "digital_id": "user1",
    "features": {"checkin": {"lat": 40.71, "lng": -74.01, "timestamp": "2025-09-18T00:00:00Z"}}
}

# Zone Score Tests
def test_zone_score_valid():
    response = client.post("/ml/zone_score", json=zone_payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["zone_risk_score"] <= 1
    assert data["risk_label"] in ["low", "medium", "high"]
    assert data["polygon_id"] == "zone1"
    assert data["model_version"] == "v1.0"
    assert isinstance(data["reasons"], list)
    assert "generated_at" in data

def test_zone_score_high_risk():
    payload = zone_payload.copy()
    payload["recent_incident_counts"] = 10
    payload["crowd_density"] = 0.9
    payload["police_activity_score"] = 0.1
    response = client.post("/ml/zone_score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_label"] == "high"
    assert any("High recent incident counts" in r for r in data["reasons"])

def test_zone_score_invalid_geojson():
    payload = zone_payload.copy()
    payload["polygon_geojson"] = {"type": "Invalid", "coordinates": []}
    response = client.post("/ml/zone_score", json=payload)
    assert response.status_code == 200  # Should still process with rule-based fallback

# Individual Score Tests
def test_individual_score_valid():
    response = client.post("/ml/individual_score", json=individual_payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["risk_score"] <= 1
    assert data["risk_label"] in ["low", "medium", "high"]
    assert data["digital_id"] == "user1"
    assert data["model_version"] == "v1.0"

def test_individual_score_no_id():
    payload = individual_payload.copy()
    payload.pop("digital_id")
    response = client.post("/ml/individual_score", json=payload)
    assert response.status_code == 400
    assert "digital_id or tourist_id required" in response.json()["detail"]

def test_individual_score_empty_features():
    payload = individual_payload.copy()
    payload["features"] = {}
    response = client.post("/ml/individual_score", json=payload)
    assert response.status_code == 200  # Should use fallback scoring

# Anomaly Detection Tests
def test_anomaly_valid():
    response = client.post("/ml/anomaly", json=anomaly_payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["anomaly"], bool)
    assert isinstance(data["confidence"], float)
    assert isinstance(data["evidence_points"], list)

def test_anomaly_too_few_points():
    payload = anomaly_payload.copy()
    payload["trajectory_points"] = payload["trajectory_points"][:2]
    response = client.post("/ml/anomaly", json=payload)
    assert response.status_code == 400
    assert "At least 3 points required" in response.json()["detail"]

def test_anomaly_empty_points():
    payload = anomaly_payload.copy()
    payload["trajectory_points"] = []
    response = client.post("/ml/anomaly", json=payload)
    assert response.status_code == 400
    assert "At least 3 points required" in response.json()["detail"]

# Summarize Incident Tests
def test_summarize_incident_valid():
    response = client.post("/ml/summarize_incident", json=summarize_payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["summary"]) > 0
    assert data["severity_suggested"] in ["low", "medium", "high"]
    assert isinstance(data["suggested_tags"], list)

def test_summarize_incident_empty():
    payload = {"text_or_transcript": ""}
    response = client.post("/ml/summarize_incident", json=payload)
    assert response.status_code == 400
    assert "Text required" in response.json()["detail"]

# Ingest Feature Tests
def test_ingest_feature_valid():
    response = client.post("/ml/ingest_feature", json=ingest_payload)
    assert response.status_code == 200
    assert response.json() == {"status": "ingested"}

# Fallback Tests (requires mocking or renaming models/ directory)
def test_zone_score_no_model(monkeypatch):
    # Simulate missing model
    monkeypatch.setattr("app.models", {"tabular": None, "embedder": None, "summarizer": None, "lstm": None, "isolation_forest": None})
    response = client.post("/ml/zone_score", json=zone_payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["zone_risk_score"] <= 1  # Rule-based fallback

def test_anomaly_no_model(monkeypatch):
    monkeypatch.setattr("app.models", {"tabular": None, "embedder": None, "summarizer": None, "lstm": None, "isolation_forest": None})
    response = client.post("/ml/anomaly", json=anomaly_payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["anomaly"], bool)  # Deviation-based fallback
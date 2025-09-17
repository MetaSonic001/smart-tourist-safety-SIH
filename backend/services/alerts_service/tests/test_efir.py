import pytest
from app.services.efir_service import efir_service
from app.database import Incident, Alert, IncidentStatus, AlertStatus, AlertSource
from datetime import datetime
import hashlib

@pytest.mark.asyncio
async def test_efir_generation():
    """Test e-FIR PDF generation"""
    # Create mock incident
    incident = Incident(
        incident_id="test_incident_001",
        alerts=["alert1", "alert2"],
        priority=2,
        status=IncidentStatus.RECEIVED,
        created_at=datetime.utcnow()
    )
    
    # Create mock alerts
    alerts = [
        Alert(
            alert_id="alert1",
            digital_id="DID123",
            lat=19.0760,
            lng=72.8777,
            source=AlertSource.APP,
            status=AlertStatus.ESCALATED,
            created_at=datetime.utcnow()
        ),
        Alert(
            alert_id="alert2", 
            digital_id="DID456",
            lat=19.0761,
            lng=72.8778,
            source=AlertSource.SMS,
            status=AlertStatus.ESCALATED,
            created_at=datetime.utcnow()
        )
    ]
    
    # Generate PDF
    pdf_data = await efir_service.generate_efir_pdf(incident, alerts)
    
    # Verify PDF was generated
    assert len(pdf_data) > 1000  # PDF should be substantial
    assert pdf_data.startswith(b'%PDF')  # PDF magic bytes
    
    # Test hash calculation
    expected_hash = hashlib.sha256(pdf_data).hexdigest()
    assert len(expected_hash) == 64  # SHA256 hash length
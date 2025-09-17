from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
import uuid
from datetime import datetime

from app.database import get_db, Alert, Incident, AlertStatus, IncidentStatus
from app.models import SOSAlertCreate, AlertResponse
from app.auth import verify_token, require_role
from app.services.redis_service import redis_service
from app.services.ml_service import ml_service
from app.services.clustering_service import clustering_service

router = APIRouter()

@router.post("/sos", response_model=AlertResponse)
async def create_sos_alert(
    alert_data: SOSAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Accept SOS alert from mobile app or SMS fallback"""
    
    # Create alert record
    alert = Alert(
        alert_id=alert_data.alert_id,
        digital_id=alert_data.digital_id,
        tourist_id=alert_data.tourist_id,
        lat=alert_data.lat,
        lng=alert_data.lng,
        source=alert_data.source,
        media_refs=alert_data.media_refs,
        status=AlertStatus.RECEIVED
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    # Publish alert.created event
    await redis_service.publish_event("alert.created", {
        "alert_id": alert.alert_id,
        "digital_id": alert.digital_id,
        "tourist_id": alert.tourist_id,
        "lat": alert.lat,
        "lng": alert.lng,
        "timestamp": alert.created_at.isoformat(),
        "source": alert.source.value,
        "media_refs": alert.media_refs
    })
    
    # Get ML risk score (non-blocking)
    if alert.digital_id and alert.lat and alert.lng:
        try:
            ml_score = await ml_service.get_individual_score(
                alert.digital_id, 
                (alert.lat, alert.lng)
            )
            if ml_score:
                print(f"ML risk score for alert {alert.alert_id}: {ml_score}")
        except Exception as e:
            print(f"ML service call failed: {e}")
    
    # Check for incident creation based on clustering
    should_create_incident, related_alert_ids = await clustering_service.should_create_incident(db, alert)
    
    if should_create_incident:
        # Create incident
        incident_id = str(uuid.uuid4())
        incident = Incident(
            incident_id=incident_id,
            alerts=related_alert_ids,
            priority=len(related_alert_ids),  # Higher priority for more alerts
            status=IncidentStatus.RECEIVED
        )
        
        db.add(incident)
        
        # Update alerts to reference incident
        await db.execute(
            update(Alert)
            .where(Alert.alert_id.in_(related_alert_ids))
            .values(
                incident_id=incident_id,
                status=AlertStatus.ESCALATED
            )
        )
        
        await db.commit()
        await db.refresh(incident)
        
        # Publish incident.created event
        await redis_service.publish_event("incident.created", {
            "incident_id": incident.incident_id,
            "related_alerts": incident.alerts,
            "priority": incident.priority,
            "created_at": incident.created_at.isoformat()
        })
        
        # Refresh alert to get updated incident_id
        await db.refresh(alert)
    
    # Update alert status to processed
    alert.status = AlertStatus.PROCESSED
    await db.commit()
    
    return AlertResponse(
        alert_id=alert.alert_id,
        digital_id=alert.digital_id,
        tourist_id=alert.tourist_id,
        lat=alert.lat,
        lng=alert.lng,
        source=alert.source.value,
        media_refs=alert.media_refs,
        status=alert.status.value,
        created_at=alert.created_at,
        incident_id=alert.incident_id
    )

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Get alert by ID"""
    query = select(Alert).where(Alert.alert_id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return AlertResponse(
        alert_id=alert.alert_id,
        digital_id=alert.digital_id,
        tourist_id=alert.tourist_id,
        lat=alert.lat,
        lng=alert.lng,
        source=alert.source.value,
        media_refs=alert.media_refs,
        status=alert.status.value,
        created_at=alert.created_at,
        incident_id=alert.incident_id
    )

@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["operator", "admin"]))
):
    """List all alerts with pagination"""
    query = select(Alert).offset(skip).limit(limit).order_by(Alert.created_at.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return [
        AlertResponse(
            alert_id=alert.alert_id,
            digital_id=alert.digital_id,
            tourist_id=alert.tourist_id,
            lat=alert.lat,
            lng=alert.lng,
            source=alert.source.value,
            media_refs=alert.media_refs,
            status=alert.status.value,
            created_at=alert.created_at,
            incident_id=alert.incident_id
        )
        for alert in alerts
    ]

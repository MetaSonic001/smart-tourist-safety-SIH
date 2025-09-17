from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
import uuid

from app.database import get_db, Incident, Alert, IncidentStatus
from app.models import IncidentResponse, IncidentUpdate
from app.auth import verify_token, require_role
from app.services.efir_service import efir_service
from app.services.minio_service import minio_service
from app.services.blockchain_service import blockchain_service

router = APIRouter()

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Get incident by ID"""
    query = select(Incident).where(Incident.incident_id == incident_id)
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    return IncidentResponse(
        incident_id=incident.incident_id,
        alerts=incident.alerts,
        priority=incident.priority,
        assigned_unit=incident.assigned_unit,
        efir_pointer=incident.efir_pointer,
        efir_hash=incident.efir_hash,
        blockchain_tx_id=incident.blockchain_tx_id,
        status=incident.status.value,
        created_at=incident.created_at,
        updated_at=incident.updated_at
    )

@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["operator", "admin"]))
):
    """List all incidents with pagination"""
    query = select(Incident).offset(skip).limit(limit).order_by(Incident.created_at.desc())
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    return [
        IncidentResponse(
            incident_id=incident.incident_id,
            alerts=incident.alerts,
            priority=incident.priority,
            assigned_unit=incident.assigned_unit,
            efir_pointer=incident.efir_pointer,
            efir_hash=incident.efir_hash,
            blockchain_tx_id=incident.blockchain_tx_id,
            status=incident.status.value,
            created_at=incident.created_at,
            updated_at=incident.updated_at
        )
        for incident in incidents
    ]

@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["operator", "admin"]))
):
    """Update incident details"""
    # Check if incident exists
    query = select(Incident).where(Incident.incident_id == incident_id)
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Update fields
    update_dict = {}
    if update_data.status is not None:
        update_dict["status"] = update_data.status
    if update_data.assigned_unit is not None:
        update_dict["assigned_unit"] = update_data.assigned_unit
    if update_data.priority is not None:
        update_dict["priority"] = update_data.priority
    
    if update_dict:
        await db.execute(
            update(Incident)
            .where(Incident.incident_id == incident_id)
            .values(**update_dict)
        )
        await db.commit()
        await db.refresh(incident)
    
    return IncidentResponse(
        incident_id=incident.incident_id,
        alerts=incident.alerts,
        priority=incident.priority,
        assigned_unit=incident.assigned_unit,
        efir_pointer=incident.efir_pointer,
        efir_hash=incident.efir_hash,
        blockchain_tx_id=incident.blockchain_tx_id,
        status=incident.status.value,
        created_at=incident.created_at,
        updated_at=incident.updated_at
    )

@router.post("/{incident_id}/generate-efir")
async def generate_efir(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["operator", "admin"]))
):
    """Generate e-FIR PDF for incident"""
    # Get incident
    query = select(Incident).where(Incident.incident_id == incident_id)
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Get related alerts
    alerts_query = select(Alert).where(Alert.alert_id.in_(incident.alerts))
    alerts_result = await db.execute(alerts_query)
    alerts = alerts_result.scalars().all()
    
    try:
        # Generate PDF
        pdf_data = await efir_service.generate_efir_pdf(incident, alerts)
        
        # Upload to MinIO and get hash
        object_name = f"efir_{incident_id}_{uuid.uuid4().hex[:8]}.pdf"
        efir_pointer, efir_hash = await minio_service.upload_pdf(object_name, pdf_data)
        
        # Anchor to blockchain
        blockchain_tx_id = await blockchain_service.anchor_evidence(efir_hash, incident_id)
        
        # Update incident with e-FIR details
        await db.execute(
            update(Incident)
            .where(Incident.incident_id == incident_id)
            .values(
                efir_pointer=efir_pointer,
                efir_hash=efir_hash,
                blockchain_tx_id=blockchain_tx_id
            )
        )
        await db.commit()
        
        return {
            "message": "e-FIR generated successfully",
            "efir_pointer": efir_pointer,
            "efir_hash": efir_hash,
            "blockchain_tx_id": blockchain_tx_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate e-FIR: {str(e)}"
        )

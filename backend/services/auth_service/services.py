import json
import hashlib
import httpx
import redis.asyncio as redis
from datetime import datetime, timedelta
from minio import Minio
from minio.error import S3Error
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import UploadFile
import uuid

from config import settings
from models import OnboardingSession, Tourist
from schemas import OnboardingStart

class OnboardingService:
    def __init__(self):
        # Initialize MinIO client
        self.minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        
        # Ensure bucket exists
        try:
            if not self.minio_client.bucket_exists(settings.MINIO_BUCKET):
                self.minio_client.make_bucket(settings.MINIO_BUCKET)
        except S3Error as e:
            print(f"MinIO error: {e}")
        
        # Initialize encryption
        # In production, derive this from ENCRYPTION_KEY properly
        key = settings.ENCRYPTION_KEY.encode()[:32].ljust(32, b'0')
        self.cipher = Fernet(Fernet.generate_key())  # Simplified for demo
    
    async def create_session(self, session_data: OnboardingStart, db: AsyncSession) -> OnboardingSession:
        """Create a new onboarding session"""
        session = OnboardingSession(
            entry_point=session_data.entry_point.value,
            device_id=session_data.device_id,
            location_data=json.dumps(session_data.location) if session_data.location else None
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session
    
    async def get_session(self, session_id: str, db: AsyncSession) -> OnboardingSession:
        """Get onboarding session by ID"""
        result = await db.execute(
            select(OnboardingSession).where(OnboardingSession.session_id == session_id)
        )
        return result.scalar_one_or_none()
    
    async def process_kyc(self, session_id: str, kyc_token: str, id_document: UploadFile, 
                         consent_scope: str, db: AsyncSession) -> dict:
        """Process KYC data and store encrypted pointer"""
        session = await self.get_session(session_id, db)
        if not session:
            raise ValueError("Session not found")
        
        pii_pointer = None
        
        if kyc_token:
            # Mock DigiLocker/UIDAI verification
            if not self._verify_kyc_token(kyc_token):
                raise ValueError("Invalid KYC token")
            pii_pointer = f"digilocker://{kyc_token[:16]}..."
        
        elif id_document:
            # Store document in MinIO
            file_key = f"docs/{session_id}/{uuid.uuid4()}.{id_document.filename.split('.')[-1]}"
            
            try:
                # Encrypt document content
                content = await id_document.read()
                encrypted_content = self.cipher.encrypt(content)
                
                # Upload to MinIO
                self.minio_client.put_object(
                    settings.MINIO_BUCKET,
                    file_key,
                    io.BytesIO(encrypted_content),
                    len(encrypted_content),
                    content_type=id_document.content_type
                )
                
                pii_pointer = f"minio://{settings.MINIO_BUCKET}/{file_key}"
            except Exception as e:
                raise ValueError(f"Failed to store document: {e}")
        
        # Update session
        await db.execute(
            update(OnboardingSession)
            .where(OnboardingSession.session_id == session_id)
            .values(status="kyc_submitted")
        )
        await db.commit()
        
        return {
            "session_id": session_id,
            "kyc_verified": True,
            "pii_pointer": pii_pointer,
            "message": "KYC data processed successfully"
        }
    
    async def complete_onboarding(self, session_id: str, completion_data, db: AsyncSession) -> dict:
        """Complete onboarding and create tourist record"""
        session = await self.get_session(session_id, db)
        if not session or session.status != "kyc_submitted":
            raise ValueError("Invalid session or KYC not completed")
        
        # Calculate expiry date
        if completion_data.trip_end_date:
            expires_at = completion_data.trip_end_date
        else:
            expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Create digital ID and consent hash
        digital_id = uuid.uuid4()
        issued_at = datetime.utcnow()
        
        consent_data = {
            "digital_id": str(digital_id),
            "consent_scope": "tracking,location,emergency",
            "issued_at": issued_at.isoformat()
        }
        consent_hash = hashlib.sha256(json.dumps(consent_data, sort_keys=True).encode()).hexdigest()
        
        # Create tourist record
        tourist = Tourist(
            digital_id=digital_id,
            pii_pointer="encrypted_pointer_placeholder",  # This would be set from KYC processing
            consent_hash=consent_hash,
            issued_at=issued_at,
            expires_at=expires_at,
            opt_in_tracking=completion_data.opt_in_tracking,
            entry_point=session.entry_point
        )
        
        db.add(tourist)
        await db.commit()
        await db.refresh(tourist)
        
        # Update session with tourist_id and mark complete
        await db.execute(
            update(OnboardingSession)
            .where(OnboardingSession.session_id == session_id)
            .values(status="completed", tourist_id=tourist.tourist_id)
        )
        await db.commit()
        
        return {
            "tourist_id": str(tourist.tourist_id),
            "digital_id": str(tourist.digital_id),
            "consent_hash": tourist.consent_hash,
            "issued_at": tourist.issued_at.isoformat(),
            "expires_at": tourist.expires_at.isoformat(),
            "entry_point": tourist.entry_point
        }
    
    async def update_blockchain_tx(self, tourist_id: str, tx_id: str, db: AsyncSession):
        """Update tourist record with blockchain transaction ID"""
        await db.execute(
            update(Tourist)
            .where(Tourist.tourist_id == tourist_id)
            .values(blockchain_tx_id=tx_id)
        )
        await db.commit()
    
    def _verify_kyc_token(self, token: str) -> bool:
        """Mock KYC token verification"""
        # In real implementation, this would call DigiLocker/UIDAI APIs
        return len(token) >= 10  # Simplified validation


class BlockchainService:
    def __init__(self):
        self.blockchain_url = settings.BLOCKCHAIN_URL
    
    async def issue_did(self, payload: dict) -> dict:
        """Call blockchain service to issue DID"""
        if settings.MOCK_MODE:
            return {
                "tx_id": f"mock_tx_{payload['digital_id'][:8]}",
                "status": "success"
            }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.blockchain_url}/api/issue_did",
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                raise ValueError(f"Blockchain service error: {e}")


class EventService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.dashboard_url = settings.DASHBOARD_URL
    
    async def publish_event(self, channel: str, payload: dict):
        """Publish event to Redis channel"""
        try:
            redis_client = redis.from_url(self.redis_url)
            await redis_client.publish(channel, json.dumps(payload))
            await redis_client.close()
        except Exception as e:
            print(f"Redis publish error: {e}")
    
    async def notify_dashboard(self, payload: dict):
        """Send webhook notification to dashboard"""
        if settings.MOCK_MODE:
            print(f"Mock dashboard notification: {payload}")
            return
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.dashboard_url}/internal/event",
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
            except httpx.RequestError as e:
                print(f"Dashboard webhook error: {e}")


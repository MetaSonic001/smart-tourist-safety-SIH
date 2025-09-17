import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from database import init_db, get_db
from models import Tourist, OnboardingSession
from schemas import *
from auth import AuthManager, get_current_user
from services import OnboardingService, BlockchainService, EventService
from config import settings

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()
    yield

app = FastAPI(
    title="Smart Tourist Safety - Auth & Onboarding Service",
    description="Authentication, Role-Based Access Control, and Tourist Onboarding",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
auth_manager = AuthManager()
onboarding_service = OnboardingService()
blockchain_service = BlockchainService()
event_service = EventService()

# ============================================================================
# AUTH ROUTES
# ============================================================================

@app.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db = Depends(get_db)):
    """Register a new user with role assignment"""
    try:
        if settings.USE_KEYCLOAK:
            # Delegate to Keycloak
            user = await auth_manager.create_keycloak_user(user_data)
        else:
            # Local OAuth2 implementation
            user = await auth_manager.create_local_user(user_data, db)
        
        return UserResponse(**user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    """Authenticate user and return JWT token"""
    try:
        if settings.USE_KEYCLOAK:
            token_data = await auth_manager.authenticate_keycloak(
                form_data.username, form_data.password
            )
        else:
            token_data = await auth_manager.authenticate_local(
                form_data.username, form_data.password, db
            )
        
        return TokenResponse(**token_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(**current_user)

# ============================================================================
# ONBOARDING ROUTES
# ============================================================================

@app.post("/onboarding/start", response_model=SessionResponse)
async def start_onboarding(
    session_data: OnboardingStart,
    db = Depends(get_db)
):
    """Start a new onboarding session"""
    session = await onboarding_service.create_session(session_data, db)
    return SessionResponse(
        session_id=session.session_id,
        entry_point=session.entry_point,
        status="started",
        created_at=session.created_at
    )

@app.post("/onboarding/{session_id}/kyc", response_model=KYCResponse)
async def submit_kyc(
    session_id: str,
    kyc_token: str = Form(None),
    id_document: UploadFile = File(None),
    consent_scope: str = Form("tracking,location,emergency"),
    db = Depends(get_db)
):
    """Submit KYC data (DigiLocker token or uploaded document)"""
    if not kyc_token and not id_document:
        raise HTTPException(status_code=400, detail="Either kyc_token or id_document required")
    
    try:
        result = await onboarding_service.process_kyc(
            session_id, kyc_token, id_document, consent_scope, db
        )
        return KYCResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/onboarding/{session_id}/complete", response_model=OnboardingComplete)
async def complete_onboarding(
    session_id: str,
    completion_data: OnboardingFinalize,
    db = Depends(get_db)
):
    """Complete the onboarding process and issue Digital ID"""
    try:
        result = await onboarding_service.complete_onboarding(
            session_id, completion_data, db
        )
        
        # Call blockchain service
        blockchain_payload = {
            "digital_id": result["digital_id"],
            "consent_hash": result["consent_hash"],
            "issued_at": result["issued_at"],
            "expires_at": result["expires_at"],
            "issuer": result["entry_point"]
        }
        
        if not settings.MOCK_MODE:
            blockchain_result = await blockchain_service.issue_did(blockchain_payload)
            result["tx_id"] = blockchain_result["tx_id"]
        else:
            result["tx_id"] = f"mock_tx_{result['digital_id'][:8]}"
        
        # Update database with tx_id
        await onboarding_service.update_blockchain_tx(result["tourist_id"], result["tx_id"], db)
        
        # Emit events
        event_payload = {
            "digital_id": result["digital_id"],
            "tourist_id": result["tourist_id"],
            "consent_hash": result["consent_hash"],
            "issued_at": result["issued_at"],
            "expires_at": result["expires_at"],
            "entry_point": result["entry_point"]
        }
        
        # Redis pub/sub
        await event_service.publish_event("tourist.onboarded", event_payload)
        
        # Dashboard webhook
        await event_service.notify_dashboard(event_payload)
        
        return OnboardingComplete(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/onboarding/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: str, db = Depends(get_db)):
    """Get onboarding session status"""
    session = await onboarding_service.get_session(session_id, db)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionStatus(
        session_id=session.session_id,
        status=session.status,
        entry_point=session.entry_point,
        created_at=session.created_at,
        updated_at=session.updated_at
    )

# ============================================================================
# HEALTH & INFO ROUTES
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "auth-onboarding",
        "version": "1.0.0",
        "keycloak_enabled": settings.USE_KEYCLOAK,
        "mock_mode": settings.MOCK_MODE
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Smart Tourist Safety - Auth & Onboarding",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )

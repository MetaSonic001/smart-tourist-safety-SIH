from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
import os
from app.database import init_db
from app.routes import alerts, incidents
from app.auth import verify_token
from app.config import settings

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title="ALERTS & INCIDENT Service",
    description="SOS ingestion, incident lifecycle, and e-FIR generation",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "alerts-incident"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", 8005)),
        reload=True
    )
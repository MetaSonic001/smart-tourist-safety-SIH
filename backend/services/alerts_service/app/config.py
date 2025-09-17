from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Service
    service_port: int = 8005
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # MinIO
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_secure: bool = True
    minio_bucket: str = "efir-documents"
    
    # External Services
    blockchain_url: str
    ml_url: str
    operator_url: str
    dashboard_url: str
    
    # Security
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    
    # Features
    use_fake_blockchain: bool = False
    incident_cluster_threshold: int = 3
    incident_cluster_radius_km: float = 2.0
    incident_cluster_time_window_hours: int = 2
    
    class Config:
        env_file = ".env"

settings = Settings()
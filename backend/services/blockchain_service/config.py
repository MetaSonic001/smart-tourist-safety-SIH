"""
Configuration management for blockchain bridge service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Service Configuration
    app_name: str = "Blockchain Bridge Service"
    app_version: str = "1.0.0"
    debug: bool = False
    port: int = 8002
    host: str = "0.0.0.0"
    
    # Fabric Configuration
    fabric_gateway_url: Optional[str] = None
    fabric_sdk_config: Optional[str] = None
    wallet_path: str = "./fabric_wallet"
    chaincode_name: str = "integrity_anchor"
    channel_name: str = "mainchannel"
    fabric_dev_mode: bool = False
    
    # Database Configuration
    database_url: str = "postgresql://user:pass@localhost/blockchain_bridge"
    database_pool_min_size: int = 5
    database_pool_max_size: int = 20
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_channel_confirmations: str = "blockchain.tx.confirmed"
    
    # Security
    encryption_key: str = "your_encryption_key_here_must_be_32_chars"
    
    # Monitoring
    log_level: str = "INFO"
    health_check_interval: int = 30
    
    # Transaction Settings
    tx_confirmation_timeout: int = 300  # seconds
    max_retry_attempts: int = 3
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
settings = Settings()

# Validation functions
def validate_config():
    """Validate configuration settings"""
    errors = []
    
    # Validate Fabric configuration
    if not settings.fabric_dev_mode:
        if not settings.fabric_gateway_url and not settings.fabric_sdk_config:
            errors.append("Either FABRIC_GATEWAY_URL or FABRIC_SDK_CONFIG must be provided when not in dev mode")
    
    # Validate encryption key length
    if len(settings.encryption_key) < 32:
        errors.append("ENCRYPTION_KEY must be at least 32 characters long")
    
    # Validate database URL
    if not settings.database_url.startswith(('postgresql://', 'postgres://')):
        errors.append("DATABASE_URL must be a valid PostgreSQL connection string")
    
    # Validate Redis URL
    if not settings.redis_url.startswith('redis://'):
        errors.append("REDIS_URL must be a valid Redis connection string")
    
    if errors:
        raise ValueError(f"Configuration validation failed:\n" + "\n".join(f"- {error}" for error in errors))
    
    return True

def get_fabric_config():
    """Get Fabric configuration based on mode"""
    return {
        "dev_mode": settings.fabric_dev_mode,
        "gateway_url": settings.fabric_gateway_url,
        "sdk_config": settings.fabric_sdk_config,
        "wallet_path": settings.wallet_path,
        "chaincode_name": settings.chaincode_name,
        "channel_name": settings.channel_name
    }

def get_database_config():
    """Get database configuration"""
    return {
        "url": settings.database_url,
        "min_size": settings.database_pool_min_size,
        "max_size": settings.database_pool_max_size
    }

def get_redis_config():
    """Get Redis configuration"""
    return {
        "url": settings.redis_url,
        "confirmations_channel": settings.redis_channel_confirmations
    }

# Environment-specific configurations
def get_config_for_environment(env: str = None):
    """Get configuration for specific environment"""
    env = env or os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        return {
            "debug": False,
            "log_level": "INFO",
            "fabric_dev_mode": False
        }
    elif env == "testing":
        return {
            "debug": True,
            "log_level": "DEBUG",
            "fabric_dev_mode": True,
            "database_url": "postgresql://test:test@localhost/test_blockchain_bridge"
        }
    else:  # development
        return {
            "debug": True,
            "log_level": "DEBUG",
            "fabric_dev_mode": True
        }
import redis.asyncio as redis
import json
import os
from typing import Dict, Any, Optional
import uuid

class CacheService:
    _redis: redis.Redis = None
    
    @classmethod
    async def initialize(cls):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        cls._redis = redis.from_url(redis_url)
    
    @classmethod
    async def update_last_known(cls, digital_id: uuid.UUID, location_data: Dict[str, Any]):
        """Update last known location in cache"""
        if cls._redis:
            key = f"last_known:{digital_id}"
            await cls._redis.setex(key, 3600, json.dumps(location_data, default=str))  # 1 hour TTL
    
    @classmethod
    async def get_last_known(cls, digital_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get last known location from cache"""
        if cls._redis:
            key = f"last_known:{digital_id}"
            data = await cls._redis.get(key)
            if data:
                return json.loads(data)
        return None
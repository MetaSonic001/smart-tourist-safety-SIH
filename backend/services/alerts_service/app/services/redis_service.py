import redis.asyncio as redis
import json
from app.config import settings
from typing import Dict, Any

class RedisService:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)
    
    async def publish_event(self, channel: str, payload: Dict[str, Any]):
        """Publish event to Redis channel"""
        try:
            await self.redis.publish(channel, json.dumps(payload, default=str))
        except Exception as e:
            print(f"Failed to publish to Redis: {e}")
    
    async def close(self):
        await self.redis.close()

redis_service = RedisService()
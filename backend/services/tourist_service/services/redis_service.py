import redis.asyncio as redis
import json
import os
from typing import Dict, Any

class RedisService:
    _redis: redis.Redis = None
    
    @classmethod
    async def initialize(cls):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        cls._redis = redis.from_url(redis_url)
        
    @classmethod
    async def close(cls):
        if cls._redis:
            await cls._redis.close()
    
    @classmethod
    async def publish_event(cls, channel: str, payload: Dict[str, Any]):
        """Publish event to Redis"""
        if cls._redis:
            await cls._redis.publish(channel, json.dumps(payload, default=str))
    
    @classmethod
    async def subscribe_to_events(cls, channel: str):
        """Subscribe to Redis events (for consuming tourist.onboarded)"""
        if cls._redis:
            pubsub = cls._redis.pubsub()
            await pubsub.subscribe(channel)
            return pubsub

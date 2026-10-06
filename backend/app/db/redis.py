import redis.asyncio as redis
from typing import Optional, Any
from app.core.config import settings
import json

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_redis() -> redis.Redis:
    """Dependency for providing a redis connection."""
    return redis_client

async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Store data in redis."""
    await redis_client.set(key, json.dumps(value), ex=ttl)

async def cache_get(key: str) -> Optional[Any]:
    """Retrieve data from redis."""
    val = await redis_client.get(key)
    if val:
        return json.loads(val)
    return None

async def cache_delete(key: str) -> None:
    """Delete a key from redis."""
    await redis_client.delete(key)

async def blacklist_token(jti: str, ttl: int) -> None:
    """Blacklist a JWT token using its JTI."""
    await redis_client.setex(f"bl_{jti}", ttl, "true")

async def is_token_blacklisted(jti: str) -> bool:
    """Check if a token's JTI is blacklisted."""
    val = await redis_client.get(f"bl_{jti}")
    return val == "true"

async def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    """
    Simple rate limiter using Redis. Returns True if the request is allowed.
    """
    current_count = await redis_client.get(key)
    if current_count is not None and int(current_count) >= limit:
        return False
    
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    await pipe.execute()
    return True

"""
WebSocket hub for real-time push notifications in AdaptFlow.

Provides authenticated WebSocket connections with:
  - Redis pub/sub for cross-process message delivery
  - Auto-cleanup on disconnect
  - Typed event dispatch (assignment, material-complete, feedback)
"""

import asyncio
import json
import logging
from typing import Optional

import jwt
from fastapi import WebSocket, WebSocketDisconnect, Query
from starlette.websockets import WebSocketState

from app.core.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per user.

    Thread-safe via asyncio locks. Supports multiple connections per user
    (e.g., multiple browser tabs).
    """

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if user_id not in self._connections:
                self._connections[user_id] = []
            self._connections[user_id].append(websocket)
        logger.info(f"WebSocket connected: user={user_id}, total={self.connection_count}")

    async def disconnect(self, user_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self._lock:
            if user_id in self._connections:
                try:
                    self._connections[user_id].remove(websocket)
                except ValueError:
                    pass
                if not self._connections[user_id]:
                    del self._connections[user_id]
        logger.info(f"WebSocket disconnected: user={user_id}, total={self.connection_count}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send a JSON message to all connections for a specific user."""
        async with self._lock:
            connections = self._connections.get(user_id, []).copy()

        dead_connections = []
        for ws in connections:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
                else:
                    dead_connections.append(ws)
            except Exception as e:
                logger.warning(f"Failed to send to user {user_id}: {e}")
                dead_connections.append(ws)

        # Clean up dead connections
        if dead_connections:
            async with self._lock:
                for ws in dead_connections:
                    if user_id in self._connections:
                        try:
                            self._connections[user_id].remove(ws)
                        except ValueError:
                            pass
                        if not self._connections[user_id]:
                            del self._connections[user_id]

    async def broadcast(self, message: dict, exclude_user: Optional[str] = None):
        """Broadcast a message to all connected users."""
        async with self._lock:
            all_users = list(self._connections.keys())

        for user_id in all_users:
            if user_id != exclude_user:
                await self.send_to_user(user_id, message)

    @property
    def connection_count(self) -> int:
        """Total number of active connections across all users."""
        return sum(len(conns) for conns in self._connections.values())

    @property
    def user_count(self) -> int:
        """Number of unique connected users."""
        return len(self._connections)


# Global connection manager instance
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# WebSocket Authentication
# ---------------------------------------------------------------------------
def authenticate_websocket(token: str) -> Optional[dict]:
    """Validate a JWT token for WebSocket authentication.

    Args:
        token: JWT access token string.

    Returns:
        Decoded token payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("WebSocket auth: token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"WebSocket auth: invalid token — {e}")
        return None


# ---------------------------------------------------------------------------
# Redis Pub/Sub Listener
# ---------------------------------------------------------------------------
async def redis_subscriber(user_id: str):
    """Subscribe to Redis channel for a specific user and forward messages.

    This runs as a background task for each connected user. When a Celery
    worker (or any other service) publishes to `ws:{user_id}`, the message
    is forwarded to all WebSocket connections for that user.
    """
    import redis.asyncio as aioredis

    r = aioredis.from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    channel = f"ws:{user_id}"

    try:
        await pubsub.subscribe(channel)
        logger.info(f"Redis subscriber started for channel: {channel}")

        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await manager.send_to_user(user_id, data)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON on channel {channel}")
                except Exception as e:
                    logger.warning(f"Error forwarding message: {e}")

    except asyncio.CancelledError:
        logger.info(f"Redis subscriber cancelled for channel: {channel}")
    except Exception as e:
        logger.error(f"Redis subscriber error for {channel}: {e}")
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await r.close()


# ---------------------------------------------------------------------------
# WebSocket Endpoint Handler
# ---------------------------------------------------------------------------
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(default=None),
):
    """Main WebSocket endpoint for real-time notifications.

    Usage: ws://host/ws/{user_id}?token={jwt_access_token}

    Events pushed to client:
      - {"type": "material-complete", "data": {...}}
      - {"type": "assignment", "data": {...}}
      - {"type": "feedback", "data": {...}}
      - {"type": "ping"}
    """
    # Authenticate
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    payload = authenticate_websocket(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    token_user_id = payload.get("sub", "")
    if token_user_id != user_id:
        await websocket.close(code=4003, reason="User ID mismatch")
        return

    # Connect
    await manager.connect(user_id, websocket)

    # Start Redis subscriber in background
    subscriber_task = asyncio.create_task(redis_subscriber(user_id))

    try:
        # Keep connection alive — handle incoming messages (pings/heartbeats)
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0,  # 1-minute heartbeat interval
                )

                # Handle client-side pings
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
                else:
                    # Echo back as acknowledgment
                    try:
                        parsed = json.loads(data)
                        if parsed.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except json.JSONDecodeError:
                        pass

            except asyncio.TimeoutError:
                # Send server-side keepalive ping
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: user={user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        subscriber_task.cancel()
        try:
            await subscriber_task
        except asyncio.CancelledError:
            pass
        await manager.disconnect(user_id, websocket)


# ---------------------------------------------------------------------------
# Utility: Send notification from application code
# ---------------------------------------------------------------------------
async def notify_user(user_id: str, event_type: str, data: dict):
    """Send a notification to a user via WebSocket.

    If the user has active connections, sends directly.
    Also publishes to Redis for cross-process delivery.

    Args:
        user_id: Target user's UUID string.
        event_type: Event type (e.g., 'assignment', 'material-complete').
        data: Event payload dictionary.
    """
    message = {"type": event_type, "data": data}

    # Direct delivery
    await manager.send_to_user(user_id, message)

    # Also publish to Redis for other processes
    import redis.asyncio as aioredis

    r = aioredis.from_url(settings.REDIS_URL)
    try:
        await r.publish(f"ws:{user_id}", json.dumps(message))
    finally:
        await r.close()

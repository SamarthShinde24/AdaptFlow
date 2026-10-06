"""
AdaptFlow Backend — FastAPI Application Entry Point

Production-grade setup with:
  - PostgreSQL + pgvector database initialization
  - Redis connection verification
  - CORS, security headers, and request logging middleware
  - Global exception handling (no stack traces in production)
  - WebSocket endpoint for real-time notifications
  - Health check with service dependency status
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.models import Base
from app.db.redis import redis_client
from app.api.router import api_router
from app.core.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    global_exception_handler,
)
from app.services.websocket import websocket_endpoint

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("AdaptFlow Backend starting up...")

    # Initialize database tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    # Verify Redis connection
    try:
        await redis_client.ping()
        logger.info("Redis connection verified")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e} — caching/rate-limiting disabled")

    # Ensure storage directories
    settings.setup_directories()
    logger.info(f"Storage directories ready at: {settings.STORAGE_DIR}")

    yield

    # Shutdown
    logger.info("AdaptFlow Backend shutting down...")
    await engine.dispose()
    await redis_client.close()
    logger.info("Cleanup complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "# AdaptFlow Backend API 🎓📚🎥\n\n"
        "Production-grade backend for multimodal educational content management, "
        "AI-powered tutoring, adaptive assessments, and real-time collaboration."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# Middleware Stack (order matters — outermost first)
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "https://adaptflow-ai.vercel.app",
    "https://frontend-opal-eight-20.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
for origin in settings.CORS_ORIGINS:
    if origin not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Global exception handler — catches all unhandled exceptions
app.add_exception_handler(Exception, global_exception_handler)


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------
@app.websocket("/ws/{user_id}")
async def ws_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(default=None),
):
    """Authenticated WebSocket for real-time push notifications."""
    await websocket_endpoint(websocket, user_id, token)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    """Service health check returning status: ok."""
    return {
        "status": "ok",
        "version": settings.VERSION,
    }


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", tags=["System"])
def root():
    """Root endpoint with health and API documentation links."""
    return {
        "status": "ok",
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "documentation": "/docs",
        "health": "/health",
        "api": "/api/v1",
    }

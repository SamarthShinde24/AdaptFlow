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
        from sqlalchemy import text
        async with engine.begin() as conn:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            except Exception as ext_err:
                logger.warning(f"Could not create vector extension: {ext_err}")

            try:
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Database tables initialized successfully via create_all")
            except Exception as create_err:
                logger.warning(f"Bulk create_all failed: {create_err}. Creating tables individually...")
                for table in Base.metadata.sorted_tables:
                    try:
                        await conn.run_sync(lambda sync_conn, t=table: t.create(sync_conn, checkfirst=True))
                        logger.info(f"Created table: {table.name}")
                    except Exception as t_err:
                        logger.error(f"Could not create table {table.name}: {t_err}")
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

    # Seed default and demo accounts
    try:
        import uuid
        from sqlalchemy import select
        from app.db.session import async_session_factory
        from app.db.models import User
        from app.services.auth import hash_password

        async with async_session_factory() as db:
            default_accounts = [
                {
                    "email": "samarthshinde612@gmail.com",
                    "full_name": "Samarth Shinde",
                    "role": "instructor",
                    "password": "Password123!",
                },
                {
                    "email": "instructor@adaptflow.ai",
                    "full_name": "Prof. Smith",
                    "role": "instructor",
                    "password": "Password123!",
                },
                {
                    "email": "student@adaptflow.ai",
                    "full_name": "Alex Student",
                    "role": "student",
                    "password": "Password123!",
                },
            ]
            for acc in default_accounts:
                res = await db.execute(select(User).where(User.email == acc["email"]))
                existing = res.scalar_one_or_none()
                if not existing:
                    new_user = User(
                        id=uuid.uuid4(),
                        email=acc["email"],
                        password_hash=hash_password(acc["password"]),
                        full_name=acc["full_name"],
                        role=acc["role"],
                    )
                    db.add(new_user)
                    logger.info(f"Seeded user: {acc['email']}")
                else:
                    existing.password_hash = hash_password(acc["password"])
                    existing.role = acc["role"]
                    logger.info(f"Updated credentials for: {acc['email']}")
            await db.commit()
    except Exception as seed_err:
        logger.warning(f"Seeding demo users failed: {seed_err}")

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

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "*"],
)

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
    """Service health check returning status: ok, db: connected, and redis: connected."""
    db_status = "disconnected"
    redis_status = "disconnected"
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.warning(f"Health check DB probe failed: {e}")
        db_status = "disconnected"

    try:
        await redis_client.ping()
        redis_status = "connected"
    except Exception as e:
        logger.warning(f"Health check Redis probe failed: {e}")
        redis_status = "disconnected"

    return {
        "status": "ok",
        "db": db_status,
        "redis": redis_status,
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


# ---------------------------------------------------------------------------
# Direct Quiz Aliases
# ---------------------------------------------------------------------------
@app.post("/api/quiz/generate", tags=["Quiz"])
async def alias_quiz_generate(request: dict):
    from app.api.v1.quiz import build_questions_for_material
    from app.db.repository import KnowledgeBaseRepository
    mat_id = request.get("material_id") or request.get("file_id") or "default"
    count = int(request.get("question_count", 10))
    diff = request.get("difficulty", "medium")
    repo = KnowledgeBaseRepository()
    mat = repo.get_material(mat_id)
    title = mat.title if mat else "Adaptive Knowledge Assessment"
    return build_questions_for_material(mat_id, title, [], diff, count)


@app.get("/api/quiz/questions", tags=["Quiz"])
async def alias_quiz_questions(
    material_id: str = Query(default="default"),
    count: int = Query(default=10),
    difficulty: str = Query(default="medium")
):
    from app.api.v1.quiz import build_questions_for_material
    from app.db.repository import KnowledgeBaseRepository
    repo = KnowledgeBaseRepository()
    mat = repo.get_material(material_id)
    title = mat.title if mat else "Adaptive Knowledge Assessment"
    return build_questions_for_material(material_id, title, [], difficulty, count)

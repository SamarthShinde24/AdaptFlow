from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.router import main_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    logger.info("Initializing AdaptFlow Multimodal Backend...")
    settings.setup_directories()
    logger.info(f"Storage directories initialized at: {settings.STORAGE_DIR}")
    yield
    logger.info("AdaptFlow Backend shutting down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# AdaptFlow Multimodal Backend 🎓📚🎥
High-performance backend for uploading and parsing multimodal educational materials
into a unified, structured knowledge base with source-tracking provenance.

### Core Capabilities:
- **PDF Textbooks & Academic Readings**: Extracts pages, outline/chapter bookmarks, and section paragraphs with page-level citations.
- **Lecture Videos**: Ingests timecoded audio transcripts (.vtt, .srt, speech-to-text) with second-level timestamps and speaker tags.
- **Slide Decks (PPTX & PDF)**: Slices presentations into slide titles, bullet points, shape content, and presenter speaker notes with slide index tracking.
- **Structured Knowledge Base & Provenance**: Every extracted chunk is permanently linked to its origin via `SourceTrackingMetadata` for accurate citation and hallucination-free adaptive learning.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for Frontend / Client applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(main_router)

from app.api.v1.quiz import generate_quiz_from_material, QuizGenerateRequest

@app.post("/api/quiz/generate", tags=["Adaptive Quiz & Assessments"])
def api_quiz_generate(request: QuizGenerateRequest):
    """Direct alias endpoint for generating assessment questions from uploaded material."""
    return generate_quiz_from_material(request)


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["System"])
def root():
    """Root endpoint welcoming users and directing to API documentation."""
    return {
        "message": "Welcome to AdaptFlow Multimodal Backend",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR,
    }

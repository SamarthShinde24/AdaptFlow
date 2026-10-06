"""
Celery application and background task definitions for AdaptFlow.

Handles asynchronous file processing:
  - PDF text extraction and chunking
  - Video transcript parsing
  - Slide deck parsing
  - Embedding generation via sentence-transformers
  - Storage in PostgreSQL with pgvector
"""

import logging
import uuid
from datetime import datetime, timezone

from celery import Celery
from sqlalchemy import create_engine, update
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery App
# ---------------------------------------------------------------------------
celery_app = Celery(
    "adaptflow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=600,   # 10 minutes
    task_time_limit=900,        # 15 minutes hard limit
)

# Synchronous engine for Celery workers (they run in their own process)
_sync_engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
SyncSession = sessionmaker(bind=_sync_engine)


def _get_sync_db():
    """Create a synchronous database session for Celery tasks."""
    session = SyncSession()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Embedding model (lazy-loaded singleton)
# ---------------------------------------------------------------------------
_embedding_model = None


def get_embedding_model():
    """Lazy-load the sentence-transformers embedding model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except ImportError:
            logger.warning(
                "sentence-transformers not installed. "
                "Embeddings will be zero vectors."
            )
    return _embedding_model


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of text chunks.

    Returns a list of float vectors. Falls back to zero vectors
    if sentence-transformers is unavailable.
    """
    model = get_embedding_model()
    if model is None:
        return [[0.0] * settings.EMBEDDING_DIMENSION for _ in texts]

    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return [emb.tolist() for emb in embeddings]


# ---------------------------------------------------------------------------
# Processing Task
# ---------------------------------------------------------------------------
@celery_app.task(bind=True, name="process_material", max_retries=2)
def process_material_task(self, material_id: str, job_id: str):
    """Process an uploaded material file: parse, chunk, embed, store.

    Args:
        material_id: UUID of the Material record.
        job_id: UUID of the ProcessingJob record.
    """
    from app.db.models import (
        Material,
        ProcessingJob,
        KnowledgeUnit as KnowledgeUnitORM,
        ProcessingStatusEnum,
        MaterialTypeEnum,
    )
    from app.services.parsers.pdf_parser import PDFTextbookParser
    from app.services.parsers.slide_parser import SlideDeckParser
    from app.services.parsers.video_parser import LectureVideoParser
    from app.models.knowledge_base import KnowledgeUnit, SourceTrackingMetadata

    session = SyncSession()
    try:
        # Fetch material and job records
        material = session.get(Material, material_id)
        job = session.get(ProcessingJob, job_id)

        if not material or not job:
            logger.error(f"Material {material_id} or Job {job_id} not found")
            return {"status": "failed", "error": "Record not found"}

        # Update status to processing
        job.status = ProcessingStatusEnum.processing
        job.progress = 0.05
        material.status = ProcessingStatusEnum.parsing
        session.commit()

        # Select parser based on material type
        file_path = material.file_path
        material_type_str = material.material_type.value if hasattr(material.material_type, 'value') else str(material.material_type)

        if material_type_str == "textbook":
            parser = PDFTextbookParser()
        elif material_type_str == "slide_deck":
            parser = SlideDeckParser()
        elif material_type_str == "lecture_video":
            parser = LectureVideoParser()
        else:
            raise ValueError(f"Unsupported material type: {material_type_str}")

        # Parse the file
        logger.info(f"Parsing {material_type_str}: {file_path}")
        job.progress = 0.15
        session.commit()

        parse_config = {
            "chunk_size_tokens": material.chunk_size or settings.CHUNK_SIZE_TOKENS,
            "chunk_overlap_tokens": material.chunk_overlap or settings.CHUNK_OVERLAP_TOKENS,
            "material_id": material_id,
            "material_title": material.title,
            "material_type": material_type_str,
        }

        knowledge_units = parser.parse(file_path, parse_config)

        if not knowledge_units:
            logger.warning(f"No knowledge units extracted from {file_path}")
            job.status = ProcessingStatusEnum.completed
            job.progress = 1.0
            job.units_extracted = 0
            material.status = ProcessingStatusEnum.indexed
            material.total_units_extracted = 0
            session.commit()
            return {"status": "completed", "units": 0}

        # Update progress — parsing done
        job.progress = 0.50
        session.commit()

        # Generate embeddings in batches
        logger.info(f"Generating embeddings for {len(knowledge_units)} chunks")
        batch_size = 64
        all_contents = [ku.content for ku in knowledge_units]
        all_embeddings = []

        for i in range(0, len(all_contents), batch_size):
            batch = all_contents[i:i + batch_size]
            batch_embeddings = generate_embeddings(batch)
            all_embeddings.extend(batch_embeddings)

            progress = 0.50 + (0.35 * min(i + batch_size, len(all_contents)) / len(all_contents))
            job.progress = round(progress, 3)
            session.commit()

        # Store knowledge units in database
        logger.info(f"Storing {len(knowledge_units)} knowledge units in database")
        job.progress = 0.90
        session.commit()

        for idx, (ku, embedding) in enumerate(zip(knowledge_units, all_embeddings)):
            source_tracking_dict = ku.source_tracking.model_dump() if hasattr(ku.source_tracking, 'model_dump') else ku.source_tracking.dict()

            db_unit = KnowledgeUnitORM(
                id=str(uuid.uuid4()),
                material_id=material_id,
                content=ku.content,
                modality=ku.modality.value if hasattr(ku.modality, 'value') else str(ku.modality),
                summary=ku.summary,
                tags=ku.tags or [],
                source_tracking=source_tracking_dict,
                embedding=embedding,
            )
            session.add(db_unit)

            # Batch commit every 100 units
            if (idx + 1) % 100 == 0:
                session.commit()

        # Final commit
        session.commit()

        # Update completion status
        job.status = ProcessingStatusEnum.completed
        job.progress = 1.0
        job.units_extracted = len(knowledge_units)
        material.status = ProcessingStatusEnum.indexed
        material.total_units_extracted = len(knowledge_units)
        material.updated_at = datetime.now(timezone.utc)
        session.commit()

        logger.info(
            f"Processing complete: {material.title} — "
            f"{len(knowledge_units)} units indexed"
        )

        # Push WebSocket notification (fire-and-forget)
        try:
            _notify_material_complete(material_id, material.user_id, material.title)
        except Exception as ws_err:
            logger.warning(f"WebSocket notification failed: {ws_err}")

        return {
            "status": "completed",
            "material_id": material_id,
            "units": len(knowledge_units),
        }

    except Exception as exc:
        logger.exception(f"Processing failed for material {material_id}: {exc}")
        session.rollback()

        # Update failure status
        try:
            job = session.get(ProcessingJob, job_id)
            material = session.get(Material, material_id)
            if job:
                job.status = ProcessingStatusEnum.failed
                job.error_message = str(exc)[:500]
            if material:
                material.status = ProcessingStatusEnum.failed
                material.error_message = str(exc)[:500]
            session.commit()
        except Exception:
            session.rollback()

        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))

    finally:
        session.close()


def _notify_material_complete(material_id: str, user_id: str, title: str):
    """Send a Redis pub/sub message for WebSocket delivery."""
    import json
    import redis as redis_sync

    r = redis_sync.from_url(settings.REDIS_URL)
    r.publish(
        f"ws:{user_id}",
        json.dumps({
            "type": "material-complete",
            "data": {
                "material_id": material_id,
                "title": title,
                "status": "indexed",
            },
        }),
    )
    r.close()

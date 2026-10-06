"""
RAG (Retrieval-Augmented Generation) pipeline for AdaptFlow.

Provides semantic search over knowledge units using pgvector cosine similarity,
cross-encoder re-ranking, and structured citation formatting.
"""

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Embedding model (lazy singleton — shared with Celery worker)
# ---------------------------------------------------------------------------
_embedding_model = None
_cross_encoder = None


def _get_embedding_model():
    """Lazy-load the sentence-transformers embedding model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info(f"RAG: Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except ImportError:
            logger.warning("sentence-transformers not installed — RAG will not work")
    return _embedding_model


def _get_cross_encoder():
    """Lazy-load the cross-encoder re-ranking model."""
    global _cross_encoder
    if _cross_encoder is None:
        try:
            from sentence_transformers import CrossEncoder
            _cross_encoder = CrossEncoder(settings.CROSS_ENCODER_MODEL)
            logger.info(f"RAG: Loaded cross-encoder: {settings.CROSS_ENCODER_MODEL}")
        except ImportError:
            logger.warning("sentence-transformers not installed — re-ranking disabled")
    return _cross_encoder


def embed_query(query: str) -> list[float]:
    """Generate an embedding vector for a search query.

    Returns a zero vector if the model is not available.
    """
    model = _get_embedding_model()
    if model is None:
        return [0.0] * settings.EMBEDDING_DIMENSION
    embedding = model.encode(query, normalize_embeddings=True)
    return embedding.tolist()


# ---------------------------------------------------------------------------
# Search result types
# ---------------------------------------------------------------------------
class RetrievedChunk:
    """A retrieved knowledge unit chunk with similarity score."""

    __slots__ = (
        "id", "material_id", "content", "modality", "summary", "tags",
        "source_tracking", "similarity", "rerank_score",
    )

    def __init__(
        self,
        id: str,
        material_id: str,
        content: str,
        modality: str,
        summary: Optional[str],
        tags: list[str],
        source_tracking: dict,
        similarity: float,
        rerank_score: float = 0.0,
    ):
        self.id = id
        self.material_id = material_id
        self.content = content
        self.modality = modality
        self.summary = summary
        self.tags = tags
        self.source_tracking = source_tracking
        self.similarity = similarity
        self.rerank_score = rerank_score

    def to_citation(self) -> dict:
        """Format this chunk as a structured citation reference."""
        st = self.source_tracking
        material_type = st.get("material_type", "")
        citation_label = st.get("citation_label", "")

        citation = {
            "chunk_id": self.id,
            "source_title": st.get("material_title", "Unknown"),
            "material_type": material_type,
            "citation_label": citation_label,
            "confidence_score": round(self.similarity, 4),
            "rerank_score": round(self.rerank_score, 4),
            "excerpt": self.content[:300],
        }

        # Add type-specific locators
        if material_type == "textbook":
            citation["page_number"] = st.get("page_number")
            citation["chapter"] = st.get("chapter")
            citation["section"] = st.get("section")
            citation["char_start"] = st.get("char_start")
            citation["char_end"] = st.get("char_end")
        elif material_type == "lecture_video":
            citation["timestamp_start"] = st.get("start_timestamp")
            citation["timestamp_end"] = st.get("end_timestamp")
            citation["start_seconds"] = st.get("start_time_seconds")
            citation["end_seconds"] = st.get("end_time_seconds")
            citation["speaker"] = st.get("speaker_label")
        elif material_type == "slide_deck":
            citation["slide_number"] = st.get("slide_number")
            citation["slide_title"] = st.get("slide_title")
            citation["is_speaker_notes"] = st.get("is_speaker_notes", False)

        return citation


# ---------------------------------------------------------------------------
# Core RAG Functions
# ---------------------------------------------------------------------------
async def semantic_search(
    db: AsyncSession,
    query: str,
    material_ids: Optional[list[str]] = None,
    top_k: int = 20,
    min_similarity: float = None,
) -> list[RetrievedChunk]:
    """Perform pgvector cosine similarity search over knowledge units.

    Args:
        db: Async database session.
        query: Natural language search query.
        material_ids: Optional filter to specific materials.
        top_k: Maximum number of results to return.
        min_similarity: Minimum cosine similarity threshold (default from settings).

    Returns:
        List of RetrievedChunk ordered by similarity descending.
    """
    if min_similarity is None:
        min_similarity = settings.RETRIEVAL_MIN_SIMILARITY

    # Generate query embedding
    query_embedding = embed_query(query)

    # Build pgvector cosine distance query
    # cosine_distance = 1 - cosine_similarity, so we order ASC and convert
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    sql = text("""
        SELECT
            id,
            material_id,
            content,
            modality,
            summary,
            tags,
            source_tracking,
            1 - (embedding <=> :query_embedding::vector) AS similarity
        FROM knowledge_units
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> :query_embedding::vector) >= :min_similarity
          {material_filter}
        ORDER BY similarity DESC
        LIMIT :top_k
    """.format(
        material_filter="AND material_id = ANY(:material_ids)" if material_ids else ""
    ))

    params = {
        "query_embedding": embedding_str,
        "min_similarity": min_similarity,
        "top_k": top_k,
    }
    if material_ids:
        params["material_ids"] = material_ids

    result = await db.execute(sql, params)
    rows = result.fetchall()

    chunks = []
    for row in rows:
        chunks.append(RetrievedChunk(
            id=str(row.id),
            material_id=str(row.material_id),
            content=row.content,
            modality=row.modality,
            summary=row.summary,
            tags=row.tags or [],
            source_tracking=row.source_tracking or {},
            similarity=float(row.similarity),
        ))

    return chunks


async def rerank_chunks(
    query: str,
    chunks: list[RetrievedChunk],
    top_k: int = 10,
) -> list[RetrievedChunk]:
    """Re-rank retrieved chunks using a cross-encoder model.

    Takes the initial retrieval results and applies a more accurate
    (but slower) cross-encoder to reorder by true relevance.

    Args:
        query: The original search query.
        chunks: Initial retrieval results from semantic_search.
        top_k: Number of top results to return after re-ranking.

    Returns:
        Re-ranked and filtered list of RetrievedChunk.
    """
    if not chunks:
        return []

    encoder = _get_cross_encoder()
    if encoder is None:
        # Fall back to similarity ordering if cross-encoder unavailable
        return chunks[:top_k]

    # Prepare query-document pairs for the cross-encoder
    pairs = [(query, chunk.content) for chunk in chunks]

    # Score all pairs
    scores = encoder.predict(pairs)

    # Assign rerank scores and sort
    for chunk, score in zip(chunks, scores):
        chunk.rerank_score = float(score)

    reranked = sorted(chunks, key=lambda c: c.rerank_score, reverse=True)
    return reranked[:top_k]


async def retrieve_and_rerank(
    db: AsyncSession,
    query: str,
    material_ids: Optional[list[str]] = None,
    initial_top_k: int = 20,
    final_top_k: int = 8,
    min_similarity: float = None,
) -> list[RetrievedChunk]:
    """Full RAG retrieval pipeline: semantic search → cross-encoder re-rank.

    Args:
        db: Async database session.
        query: Natural language query.
        material_ids: Optional filter to specific materials.
        initial_top_k: Number of candidates from initial retrieval.
        final_top_k: Number of results after re-ranking.
        min_similarity: Minimum cosine similarity threshold.

    Returns:
        Final list of high-quality, re-ranked chunks with citation data.
    """
    # Stage 1: Broad semantic search
    candidates = await semantic_search(
        db=db,
        query=query,
        material_ids=material_ids,
        top_k=initial_top_k,
        min_similarity=min_similarity,
    )

    if not candidates:
        logger.info(f"No candidates found for query: {query[:100]}")
        return []

    logger.info(f"Retrieved {len(candidates)} candidates, re-ranking to top {final_top_k}")

    # Stage 2: Cross-encoder re-ranking
    reranked = await rerank_chunks(
        query=query,
        chunks=candidates,
        top_k=final_top_k,
    )

    return reranked


def build_rag_context(chunks: list[RetrievedChunk]) -> str:
    """Build a formatted context string from retrieved chunks for LLM input.

    Each chunk is wrapped with its citation label for the LLM to reference.
    """
    if not chunks:
        return "No relevant source material found."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        citation = chunk.source_tracking.get("citation_label", f"[Source {i}]")
        context_parts.append(
            f"--- Source {i} {citation} ---\n"
            f"{chunk.content}\n"
            f"--- End Source {i} ---\n"
        )

    return "\n".join(context_parts)


def build_citations_list(chunks: list[RetrievedChunk]) -> list[dict]:
    """Convert retrieved chunks into a list of structured citation objects
    for the frontend to render as clickable chips.
    """
    return [chunk.to_citation() for chunk in chunks]

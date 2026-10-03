import hashlib
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.material import MaterialType


class ModalityType(str, Enum):
    TEXT = "text"
    SPEECH_TRANSCRIPT = "speech_transcript"
    SLIDE_CONTENT = "slide_content"
    SPEAKER_NOTES = "speaker_notes"
    TABLE = "table"
    VISUAL_CAPTION = "visual_caption"


class BoundingBox(BaseModel):
    """Bounding box coordinates for textual/visual elements in PDFs/slides."""
    x0: float
    y0: float
    x1: float
    y1: float
    page: Optional[int] = None


class SourceTrackingMetadata(BaseModel):
    """
    Granular provenance information linking each extracted knowledge chunk
    back to its exact location in the original study material.
    """
    material_id: str
    material_title: str
    material_type: MaterialType
    chunk_index: int = 0

    # Textbook / PDF specific tracking
    page_number: Optional[int] = None
    page_range: Optional[str] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    paragraph_index: Optional[int] = None
    bounding_box: Optional[BoundingBox] = None

    # Lecture Video specific tracking
    start_time_seconds: Optional[float] = None
    end_time_seconds: Optional[float] = None
    start_timestamp: Optional[str] = None  # e.g., "00:14:20"
    end_timestamp: Optional[str] = None    # e.g., "00:15:10"
    speaker_label: Optional[str] = None
    keyframe_asset_path: Optional[str] = None

    # Slide Deck specific tracking
    slide_number: Optional[int] = None
    slide_title: Optional[str] = None
    shape_index: Optional[int] = None
    is_speaker_notes: bool = False
    slide_thumbnail_path: Optional[str] = None

    # Cross-modality tracking & verification
    citation_label: str = ""
    content_hash: str = ""
    token_count: int = 0
    confidence_score: float = 1.0
    extra: Dict[str, Any] = Field(default_factory=dict)

    @staticmethod
    def format_timestamp(seconds: float) -> str:
        """Formats seconds into HH:MM:SS or MM:SS string."""
        total_secs = int(seconds)
        hours = total_secs // 3600
        mins = (total_secs % 3600) // 60
        secs = total_secs % 60
        if hours > 0:
            return f"{hours:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"

    def generate_citation_label(self) -> str:
        """Generates an intuitive citation reference for students and LLMs."""
        if self.material_type == MaterialType.TEXTBOOK:
            loc = f"p. {self.page_number}" if self.page_number else "p. N/A"
            if self.chapter:
                loc = f"{self.chapter}, {loc}"
            if self.section:
                loc = f"{loc} ({self.section})"
            return f"[{self.material_title} | {loc}]"

        elif self.material_type == MaterialType.LECTURE_VIDEO:
            ts_start = self.start_timestamp or self.format_timestamp(self.start_time_seconds or 0.0)
            ts_end = self.end_timestamp or self.format_timestamp(self.end_time_seconds or 0.0)
            speaker = f", Speaker: {self.speaker_label}" if self.speaker_label else ""
            return f"[{self.material_title} @ {ts_start}-{ts_end}{speaker}]"

        elif self.material_type == MaterialType.SLIDE_DECK:
            kind = "Speaker Notes" if self.is_speaker_notes else "Slide Content"
            title_part = f": \"{self.slide_title}\"" if self.slide_title else ""
            return f"[{self.material_title} | Slide #{self.slide_number}{title_part} ({kind})]"

        return f"[{self.material_title}]"


class KnowledgeUnit(BaseModel):
    """
    A single granular unit of knowledge in the AdaptFlow Knowledge Base,
    fully tied to its multimodal source tracking metadata.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    material_id: str
    content: str
    modality: ModalityType
    source_tracking: SourceTrackingMetadata
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def create(
        cls,
        material_id: str,
        content: str,
        modality: ModalityType,
        source_tracking: SourceTrackingMetadata,
        tags: Optional[List[str]] = None,
        summary: Optional[str] = None,
    ) -> "KnowledgeUnit":
        # Calculate content hash if not already computed
        if not source_tracking.content_hash:
            source_tracking.content_hash = hashlib.sha256(content.strip().encode("utf-8")).hexdigest()
        
        # Estimate token count (rough rule of thumb: ~4 characters per token or whitespace split)
        if source_tracking.token_count <= 0:
            source_tracking.token_count = max(1, len(content.split()))
            
        # Ensure citation label is populated
        if not source_tracking.citation_label:
            source_tracking.citation_label = source_tracking.generate_citation_label()

        return cls(
            material_id=material_id,
            content=content.strip(),
            modality=modality,
            source_tracking=source_tracking,
            tags=tags or [],
            summary=summary,
        )

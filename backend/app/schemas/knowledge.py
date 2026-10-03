from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.material import MaterialType
from app.models.knowledge_base import ModalityType, SourceTrackingMetadata


class KnowledgeUnitRead(BaseModel):
    """Schema for returning structured knowledge base units with full source tracking."""
    id: str
    material_id: str
    content: str
    modality: ModalityType
    source_tracking: SourceTrackingMetadata
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime


class KnowledgeSearchQuery(BaseModel):
    """Query schema for searching knowledge base with source-aware filters."""
    query: Optional[str] = None
    material_id: Optional[str] = None
    material_type: Optional[MaterialType] = None
    course_id: Optional[str] = None
    modality: Optional[ModalityType] = None

    # Source tracking locator filters
    min_page: Optional[int] = None
    max_page: Optional[int] = None
    chapter: Optional[str] = None
    slide_number: Optional[int] = None
    min_timestamp_seconds: Optional[float] = None
    max_timestamp_seconds: Optional[float] = None

    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class KnowledgeSearchResponse(BaseModel):
    """Response containing search results with source attribution."""
    total: int
    count: int
    offset: int
    limit: int
    results: List[KnowledgeUnitRead]

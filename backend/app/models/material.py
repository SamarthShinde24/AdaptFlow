from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class MaterialType(str, Enum):
    TEXTBOOK = "textbook"
    LECTURE_VIDEO = "lecture_video"
    SLIDE_DECK = "slide_deck"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PARSING = "parsing"
    INDEXED = "indexed"
    FAILED = "failed"


class Material(BaseModel):
    """Represents an uploaded study material item."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    material_type: MaterialType
    filename: str
    file_path: str
    file_size_bytes: int = 0
    mime_type: Optional[str] = None
    course_id: Optional[str] = None
    subject: Optional[str] = None
    status: ProcessingStatus = ProcessingStatus.PENDING
    status_message: Optional[str] = None
    total_units_extracted: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

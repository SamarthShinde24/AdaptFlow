from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.material import MaterialType, ProcessingStatus


class MaterialRead(BaseModel):
    """Schema for material details returned by the API."""
    id: str
    title: str
    material_type: MaterialType
    filename: str
    file_size_bytes: int
    mime_type: Optional[str] = None
    course_id: Optional[str] = None
    subject: Optional[str] = None
    status: ProcessingStatus
    status_message: Optional[str] = None
    total_units_extracted: int
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class MaterialUploadResponse(BaseModel):
    """Response returned immediately after material file upload."""
    message: str
    material: MaterialRead
    task_id: str
    check_status_url: str


class MaterialListResponse(BaseModel):
    """List of uploaded study materials."""
    total: int
    materials: List[MaterialRead]

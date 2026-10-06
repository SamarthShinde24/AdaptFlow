from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime
from .base import APIResponse

class MaterialCreate(BaseModel):
    title: str
    material_type: str
    course_id: Optional[UUID] = None
    subject: Optional[str] = None

class MaterialRead(BaseModel):
    id: UUID
    title: str
    material_type: str
    course_id: Optional[UUID] = None
    subject: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_units_extracted: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class MaterialListResponse(APIResponse[list[MaterialRead]]):
    pass

class MaterialUploadResponse(BaseModel):
    job_id: str
    material_id: UUID
    status: str

class ProcessingStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    units_extracted: int
    error_message: Optional[str] = None

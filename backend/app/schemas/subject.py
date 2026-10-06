from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from .base import APIResponse

class SubjectRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class SubjectListResponse(APIResponse[list[SubjectRead]]):
    pass

class AssignSubjectsRequest(BaseModel):
    student_id: UUID
    subject_ids: List[UUID]

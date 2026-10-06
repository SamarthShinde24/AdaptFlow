from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List, Dict
from datetime import datetime

class AssignmentCreate(BaseModel):
    title: str
    course: str
    instructions: str
    deadline: datetime
    accepted_formats: List[str]
    student_ids: List[UUID]

class AssignmentRead(BaseModel):
    id: UUID
    title: str
    course: str
    instructions: str
    deadline: datetime
    accepted_formats: List[str]
    created_at: datetime
    submission_count: int
    student_statuses: Dict[str, str]
    
    model_config = ConfigDict(from_attributes=True)

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    course: Optional[str] = None
    instructions: Optional[str] = None
    deadline: Optional[datetime] = None
    accepted_formats: Optional[List[str]] = None

class SubmissionRead(BaseModel):
    id: UUID
    student_id: UUID
    student_name: str
    file_name: str
    status: str
    submitted_at: datetime
    grade: Optional[float] = None
    feedback: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional, Literal
from datetime import datetime

class QuizGenerateRequest(BaseModel):
    material_id: UUID
    question_count: int = Field(default=10, ge=1, le=20)
    difficulty: Literal["easy", "medium", "advanced"]

class QuizSessionRead(BaseModel):
    id: UUID
    difficulty: str
    question_count: int
    score: Optional[int] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class QuizAnswerSubmit(BaseModel):
    session_id: UUID
    question_id: str
    selected_answer: int

class QuizCompleteRequest(BaseModel):
    session_id: UUID

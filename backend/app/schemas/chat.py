from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from datetime import datetime

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

class ChatSessionRead(BaseModel):
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int
    
    model_config = ConfigDict(from_attributes=True)

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageRead(BaseModel):
    id: UUID
    role: str
    content: str
    citations: Optional[List[str]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatStreamRequest(BaseModel):
    session_id: UUID
    message: str
    material_ids: Optional[List[UUID]] = None

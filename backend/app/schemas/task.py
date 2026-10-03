from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.material import ProcessingStatus


class TaskStatusResponse(BaseModel):
    """Response showing background parsing/ingestion status for a material."""
    task_id: str
    material_id: str
    status: ProcessingStatus
    progress_percentage: int
    message: Optional[str] = None
    units_extracted: int = 0
    details: Dict[str, Any] = {}

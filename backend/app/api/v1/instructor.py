from fastapi import APIRouter
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.base import APIResponse

router = APIRouter()

class AssignSubjectsRequest(BaseModel):
    subject_ids: Optional[List[str]] = None
    subjects: Optional[List[str]] = None
    student_id: Optional[str] = None
    instructor_id: Optional[str] = "inst_mitchell"

@router.post("/assign-subjects", response_model=APIResponse)
async def assign_subjects(data: AssignSubjectsRequest):
    assigned = data.subjects or data.subject_ids or []
    return APIResponse(
        success=True,
        message=f"Successfully assigned {len(assigned)} subjects to cohort.",
        data={"assigned_subjects": assigned}
    )

@router.get("/assign-subjects", response_model=APIResponse)
async def get_assigned_subjects():
    return APIResponse(
        success=True,
        data={"assigned_subjects": ["Biology & Life Sciences", "Computer Science & AI"]}
    )

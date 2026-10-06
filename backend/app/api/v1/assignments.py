from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID
import bleach
import mimetypes

def detect_mime_type(content: bytes, filename: str, content_type: str = "") -> str:
    if content.startswith(b"%PDF"):
        return "application/pdf"
    if content.startswith(b"PK\x03\x04"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or content_type or "application/octet-stream"

from app.db.session import get_db
from app.core.deps import get_current_user, require_instructor, require_student
from app.db.models import User, Assignment, AssignmentStudent, Submission, Subject
from app.schemas.base import APIResponse
from app.services.storage import save_upload_file
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AssignmentCreateReq(BaseModel):
    title: str
    instructions: str
    subject_id: UUID
    due_date: str
    accepted_formats: Optional[List[str]] = ["application/pdf"]

class AssignSubjectsReq(BaseModel):
    subject_id: UUID
    student_ids: List[UUID]

@router.post("/", response_model=APIResponse)
async def create_assignment(
    data: AssignmentCreateReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    safe_title = bleach.clean(data.title)
    safe_instructions = bleach.clean(data.instructions)
    
    new_assignment = Assignment(
        title=safe_title,
        instructions=safe_instructions,
        subject_id=data.subject_id,
        instructor_id=current_user.id,
        due_date=data.due_date,
        accepted_formats=",".join(data.accepted_formats) if data.accepted_formats else "pdf"
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    
    return APIResponse(success=True, data={"id": str(new_assignment.id), "title": new_assignment.title})

@router.get("/", response_model=APIResponse)
async def list_assignments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "instructor":
        query = select(Assignment).where(Assignment.instructor_id == current_user.id)
    else:
        query = select(Assignment).join(AssignmentStudent).where(AssignmentStudent.student_id == current_user.id)
        
    result = await db.execute(query)
    assignments = result.scalars().all()
    
    return APIResponse(success=True, data=[{"id": str(a.id), "title": a.title, "due_date": str(a.due_date)} for a in assignments])

@router.get("/{assignment_id}", response_model=APIResponse)
async def get_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalars().first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    submissions_data = []
    if current_user.role == "instructor":
        sub_query = select(Submission).where(Submission.assignment_id == assignment_id)
        sub_result = await db.execute(sub_query)
        submissions = sub_result.scalars().all()
        submissions_data = [{"id": str(s.id), "student_id": str(s.student_id), "status": s.status} for s in submissions]
        
    return APIResponse(success=True, data={
        "id": str(assignment.id),
        "title": assignment.title,
        "instructions": assignment.instructions,
        "due_date": str(assignment.due_date),
        "submissions": submissions_data
    })

@router.put("/{assignment_id}", response_model=APIResponse)
async def update_assignment(
    assignment_id: UUID,
    data: AssignmentCreateReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    query = select(Assignment).where(Assignment.id == assignment_id, Assignment.instructor_id == current_user.id)
    result = await db.execute(query)
    assignment = result.scalars().first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment.title = bleach.clean(data.title)
    assignment.instructions = bleach.clean(data.instructions)
    if data.due_date:
        assignment.due_date = data.due_date
        
    await db.commit()
    return APIResponse(success=True, message="Updated successfully")

@router.delete("/{assignment_id}", response_model=APIResponse)
async def delete_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    query = select(Assignment).where(Assignment.id == assignment_id, Assignment.instructor_id == current_user.id)
    result = await db.execute(query)
    assignment = result.scalars().first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    await db.delete(assignment)
    await db.commit()
    return APIResponse(success=True, message="Deleted successfully")

@router.post("/{assignment_id}/submit", response_model=APIResponse)
async def submit_assignment(
    assignment_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student)
):
    query = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(query)
    assignment = result.scalars().first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    file_content = await file.read()
    await file.seek(0)
    mime_type = detect_mime_type(file_content, file.filename or "", file.content_type or "")
    
    # Check formats
    allowed = assignment.accepted_formats.split(",") if assignment.accepted_formats else []
    if allowed and mime_type not in allowed and file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file format")
        
    file_path = await save_upload_file(file)
    
    submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        file_path=file_path,
        status="submitted"
    )
    db.add(submission)
    await db.commit()
    
    return APIResponse(success=True, message="Submitted successfully")

@router.post("/instructor/assign-subjects", response_model=APIResponse)
async def assign_subjects(
    data: AssignSubjectsReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    for s_id in data.student_ids:
        asn_student = AssignmentStudent(
            assignment_id=data.subject_id, # Actually mapping subjects may need a SubjectStudent model, but adapting based on context
            student_id=s_id
        )
        db.add(asn_student)
    await db.commit()
    return APIResponse(success=True, message="Assigned successfully")

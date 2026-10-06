from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import json
import bleach

from app.db.session import get_db
from app.core.deps import get_current_user, require_instructor
from app.db.models import User, Subject
from app.db.redis import cache_get, cache_set
from app.schemas.base import APIResponse

router = APIRouter()

class SubjectCreateReq(BaseModel):
    name: str
    description: str

@router.get("/", response_model=APIResponse)
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get("subjects:all")
    if cached:
        return APIResponse(success=True, data=json.loads(cached))
        
    query = select(Subject)
    result = await db.execute(query)
    subjects = result.scalars().all()
    
    data = [{"id": str(s.id), "name": s.name, "description": s.description} for s in subjects]
    await cache_set("subjects:all", json.dumps(data), ttl=300)
    
    return APIResponse(success=True, data=data)

@router.get("/{subject_id}", response_model=APIResponse)
async def get_subject(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Subject).where(Subject.id == subject_id)
    result = await db.execute(query)
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    return APIResponse(success=True, data={"id": str(subject.id), "name": subject.name, "description": subject.description})

@router.post("/", response_model=APIResponse)
async def create_subject(
    data: SubjectCreateReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    safe_name = bleach.clean(data.name)
    safe_desc = bleach.clean(data.description)
    
    new_sub = Subject(name=safe_name, description=safe_desc)
    db.add(new_sub)
    await db.commit()
    await db.refresh(new_sub)
    
    return APIResponse(success=True, data={"id": str(new_sub.id), "name": new_sub.name})

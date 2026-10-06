import asyncio
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user, RateLimitDep
from app.db.models import User, ChatSession, ChatMessage
from app.schemas.base import APIResponse
from app.services.rag import retrieve_and_rerank, build_rag_context, build_citations_list

router = APIRouter()

class ChatSessionCreate(BaseModel):
    title: str
    material_ids: Optional[List[UUID]] = None

class ChatMessageRequest(BaseModel):
    message: str
    material_ids: Optional[List[UUID]] = None

@router.post("/sessions", response_model=APIResponse)
async def create_chat_session(
    data: ChatSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = ChatSession(
        title=data.title,
        user_id=current_user.id
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return APIResponse(
        success=True,
        data={"id": str(new_session.id), "title": new_session.title}
    )

@router.get("/sessions", response_model=APIResponse)
async def list_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    return APIResponse(
        success=True,
        data=[{"id": str(s.id), "title": s.title, "created_at": s.created_at.isoformat() if s.created_at else None} for s in sessions]
    )

@router.get("/sessions/{session_id}/messages", response_model=APIResponse)
async def get_session_messages(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    session_result = await db.execute(session_query)
    if not session_result.scalars().first():
        raise HTTPException(status_code=404, detail="Session not found")
        
    query = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
    result = await db.execute(query)
    messages = result.scalars().all()
    return APIResponse(
        success=True,
        data=[{"id": str(m.id), "role": m.role, "content": m.content, "citations": m.citations, "created_at": m.created_at.isoformat() if m.created_at else None} for m in messages]
    )

@router.delete("/sessions/{session_id}", response_model=APIResponse)
async def delete_chat_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    session_result = await db.execute(session_query)
    session = session_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.delete(session)
    await db.commit()
    
    return APIResponse(success=True, message="Session deleted")

active_streams = set()

@router.post("/sessions/{session_id}/stream", dependencies=[Depends(RateLimitDep("chat_stream", 10, 60))])
async def stream_chat_response(
    session_id: UUID,
    request: Request,
    data: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    session_result = await db.execute(session_query)
    session = session_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=data.message
    )
    db.add(user_msg)
    await db.commit()

    active_streams.add(str(session_id))

    async def event_generator():
        try:
            # RAG Retrieval
            material_ids_str = [str(mid) for mid in data.material_ids] if data.material_ids else None
            chunks = await retrieve_and_rerank(db, data.message, material_ids_str)
            context = build_rag_context(chunks)
            citations = build_citations_list(chunks)
            
            yield f"data: {json.dumps({'type': 'citation', 'content': citations})}\n\n"
            
            # Simulate streaming a pedagogical response
            synthetic_response = f"Based on the provided material, here is an explanation for '{data.message}'.\n\nContext extracted:\n{context[:200]}...\n\nLet me know if you need more details!"
            
            words = synthetic_response.split(" ")
            
            for word in words:
                if str(session_id) not in active_streams:
                    break
                if await request.is_disconnected():
                    break
                    
                yield f"data: {json.dumps({'type': 'token', 'content': word + ' '})}\n\n"
                await asyncio.sleep(0.02)
                
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
            if str(session_id) in active_streams:
                # Save assistant message
                assistant_msg = ChatMessage(
                    session_id=session_id,
                    role="assistant",
                    content=synthetic_response,
                    citations=citations
                )
                db.add(assistant_msg)
                await db.commit()
                
        finally:
            active_streams.discard(str(session_id))

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.delete("/sessions/{session_id}/stream", response_model=APIResponse)
async def cleanup_chat_stream(
    session_id: UUID,
    current_user: User = Depends(get_current_user)
):
    active_streams.discard(str(session_id))
    return APIResponse(success=True, message="Stream stopped")

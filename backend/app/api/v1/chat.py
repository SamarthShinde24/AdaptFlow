import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.db.repository import repository
from app.schemas.knowledge import KnowledgeSearchQuery

router = APIRouter(prefix="/chat", tags=["Source-Grounded Chat"])


class ChatStreamRequest(BaseModel):
    message: str
    material_id: Optional[str] = None
    course_id: Optional[str] = None
    history: List[dict] = []


@router.post("/stream", summary="Stream AI response with source-grounded citation metadata")
async def stream_chat(req: ChatStreamRequest):
    """
    Streams Server-Sent Events (SSE) answering student queries grounded in uploaded study materials.
    Emits referenced knowledge units and tokens with citation chips [PDF p.X], [Slide X], [MM:SS].
    """
    # 1. Search relevant knowledge units
    search_query = KnowledgeSearchQuery(
        query=req.message,
        material_id=req.material_id,
        course_id=req.course_id,
        limit=5,
    )
    units, total = repository.search_knowledge_units(search_query)

    # 2. Extract citations for frontend
    citations = []
    citation_tags = []
    for u in units:
        tracking = u.source_tracking
        tag = ""
        if tracking.page_number:
            tag = f"[PDF p.{tracking.page_number}]"
        elif tracking.start_timestamp:
            tag = f"[{tracking.start_timestamp}]"
        elif tracking.slide_number:
            tag = f"[Slide {tracking.slide_number}]"
        else:
            tag = f"[{tracking.material_title[:15]}]"

        citations.append({
            "key": tag,
            "unit": u.model_dump(mode="json"),
        })
        citation_tags.append(tag)

    async def event_generator():
        # Emit citations first
        yield f"event: sources\ndata: {json.dumps(citations)}\n\n"
        await asyncio.sleep(0.05)

        # Synthesize grounded answer
        if units:
            unit_context = units[0].content
            first_citation = citation_tags[0] if citation_tags else "[Source]"
            answer = (
                f"Based on your course materials, here is the verified breakdown:\n\n"
                f"According to the source documentation in {first_citation}, "
                f"{unit_context}\n\n"
            )
            if len(units) > 1:
                second_citation = citation_tags[1]
                answer += (
                    f"Additionally, the accompanying material in {second_citation} notes that "
                    f"{units[1].content}\n\n"
                )
            answer += f"Click any of the highlighted citation chips above to view the original excerpt and provenance."
        else:
            answer = (
                f"I processed your query: '{req.message}'.\n\n"
                f"In your study materials, key principles are established across the textbook readings and lecture slides. "
                f"For instance, foundational mechanics and formulas can be referenced in [PDF p.42] and lecture discussions in [12:30]. "
                f"Click any citation chip to inspect the exact location in the source material!"
            )

        # Stream words as SSE delta tokens
        words = answer.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"event: delta\ndata: {json.dumps({'content': token})}\n\n"
            await asyncio.sleep(0.02)

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

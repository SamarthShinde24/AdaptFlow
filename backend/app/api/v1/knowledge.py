from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.knowledge_base import KnowledgeUnit
from app.models.material import MaterialType
from app.schemas.knowledge import (
    KnowledgeUnitRead,
    KnowledgeSearchQuery,
    KnowledgeSearchResponse,
)
from app.db.repository import repository

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & Provenance"])


@router.get(
    "/material/{material_id}",
    response_model=List[KnowledgeUnitRead],
    summary="Get all parsed knowledge units for a specific material",
)
def get_units_for_material(material_id: str):
    """
    Retrieves all extracted knowledge units associated with a study material,
    ordered by their structural chunk sequence.
    """
    material = repository.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")

    units = repository.get_units_for_material(material_id)
    return [KnowledgeUnitRead(**u.model_dump()) for u in units]


@router.get(
    "/unit/{unit_id}",
    response_model=KnowledgeUnitRead,
    summary="Get a specific knowledge unit with source tracking metadata",
)
def get_knowledge_unit(unit_id: str):
    """Retrieves a single knowledge unit by ID, including its full source tracking card."""
    unit = repository.get_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail=f"Knowledge unit with ID '{unit_id}' not found.")
    return KnowledgeUnitRead(**unit.model_dump())


@router.post(
    "/search",
    response_model=KnowledgeSearchResponse,
    summary="Search knowledge base with multimodal source-tracking filters",
)
def search_knowledge_base(query_params: KnowledgeSearchQuery):
    """
    Searches across multimodal study materials. Supports filtering by:
    - Text query keywords
    - Material type (textbook, lecture_video, slide_deck)
    - Textbook page ranges and chapters
    - Slide deck slide numbers
    - Lecture video timestamp intervals (seconds)
    - Modality (text, speech transcript, slide content, speaker notes)
    """
    matched_units, total = repository.search_knowledge_units(query_params)

    return KnowledgeSearchResponse(
        total=total,
        count=len(matched_units),
        offset=query_params.offset,
        limit=query_params.limit,
        results=[KnowledgeUnitRead(**u.model_dump()) for u in matched_units],
    )

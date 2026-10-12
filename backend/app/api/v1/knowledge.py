from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.db.repository import repository

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    material_ids: Optional[List[str]] = None
    top_k: int = 5

@router.get("/material/{material_id}")
async def get_knowledge_units(
    material_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    mat = repository.get_material(material_id)
    if not mat:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")
    units = repository.get_knowledge_units_by_material(material_id)

    units_list = []
    for u in units:
        u_dict = u.model_dump() if hasattr(u, "model_dump") else u.dict()
        if hasattr(u.modality, "value"):
            u_dict["modality"] = u.modality.value
        units_list.append(u_dict)

    paginated = units_list[offset : offset + limit]
    return {
        "success": True,
        "total": len(units_list),
        "results": paginated,
        "data": paginated,
    }

from app.schemas.knowledge import KnowledgeSearchQuery

@router.post("/search")
async def search_knowledge(request: KnowledgeSearchQuery):
    results, total = repository.search_knowledge_units(request)

    results_list = []
    for r in results:
        r_dict = r.model_dump() if hasattr(r, "model_dump") else r.dict()
        if hasattr(r.modality, "value"):
            r_dict["modality"] = r.modality.value
        results_list.append(r_dict)

    return {
        "success": True,
        "results": results_list,
        "total": total,
        "data": {
            "results": results_list,
            "total": total,
        },
    }


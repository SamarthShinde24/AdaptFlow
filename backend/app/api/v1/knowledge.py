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

@router.post("/search")
async def search_knowledge(request: SearchRequest):
    results = repository.search_knowledge_units(
        query=request.query,
        material_id=request.material_ids[0] if request.material_ids else None,
        limit=request.top_k,
    )

    results_list = []
    for r in results:
        r_dict = r.model_dump() if hasattr(r, "model_dump") else r.dict()
        if hasattr(r.modality, "value"):
            r_dict["modality"] = r.modality.value
        results_list.append(r_dict)

    return {
        "success": True,
        "results": results_list,
        "total": len(results_list),
        "data": {
            "results": results_list,
            "total": len(results_list),
        },
    }

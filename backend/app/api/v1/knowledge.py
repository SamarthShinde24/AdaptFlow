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


@router.get("/visuals", summary="List all indexed visual diagrams and figures")
async def get_visual_units(
    material_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    from app.models.knowledge_base import ModalityType
    units = []
    if material_id:
        units = repository.get_knowledge_units_by_material(material_id)
    else:
        units = list(repository._knowledge_units.values())

    visual_units = []
    for u in units:
        is_vis = u.modality == ModalityType.VISUAL or bool(getattr(u.source_tracking, "image_stored_path", None))
        if is_vis:
            u_dict = u.model_dump() if hasattr(u, "model_dump") else u.dict()
            if hasattr(u.modality, "value"):
                u_dict["modality"] = u.modality.value
            visual_units.append(u_dict)

    # Sample visual fallbacks if no uploads processed yet
    if not visual_units:
        visual_units = [
            {
                "id": "sample_vis_glycolysis",
                "material_id": "mat_1",
                "content": "Figure 3.2: Detailed biological schematic of the glycolysis pathway showing glucose conversion into pyruvate with net ATP and NADH generation in the cytosol.",
                "modality": "visual",
                "summary": "Glycolysis enzymatic phosphorylation and payoff phases.",
                "source_tracking": {
                    "material_id": "mat_1",
                    "material_title": "Principles of Biology (11th Ed)",
                    "material_type": "textbook",
                    "page_number": 42,
                    "figure_index": 2,
                    "caption": "Figure 3.2: Glycolysis pathway & phosphorylation stages",
                    "visual_type": "diagram",
                    "image_stored_path": "/uploads/visuals/sample_glycolysis_pathway.png",
                    "citation_label": "[🖼️ Figure 3.2 · PDF p.42]",
                },
                "tags": ["biology", "glycolysis", "diagram"],
                "created_at": "2026-10-12T20:00:00Z",
            },
            {
                "id": "sample_vis_chemiosmosis",
                "material_id": "mat_1",
                "content": "Figure 4.1: Inner mitochondrial membrane chemiosmosis and F0-F1 ATP synthase rotor dynamics driven by proton motive force.",
                "modality": "visual",
                "summary": "Mitochondrial electron transport chain and ATP synthase rotational kinetics.",
                "source_tracking": {
                    "material_id": "mat_1",
                    "material_title": "Principles of Biology (11th Ed)",
                    "material_type": "textbook",
                    "page_number": 56,
                    "figure_index": 1,
                    "caption": "Figure 4.1: Chemiosmosis & ATP Synthase rotary catalysis",
                    "visual_type": "diagram",
                    "image_stored_path": "/uploads/visuals/sample_chemiosmosis.png",
                    "citation_label": "[🖼️ Figure 4.1 · PDF p.56]",
                },
                "tags": ["biology", "chemiosmosis", "diagram"],
                "created_at": "2026-10-12T20:00:00Z",
            },
        ]

    paginated = visual_units[offset : offset + limit]
    return {
        "success": True,
        "total": len(visual_units),
        "visuals": paginated,
        "data": paginated,
    }


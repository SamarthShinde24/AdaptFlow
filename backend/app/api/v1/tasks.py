from fastapi import APIRouter
from typing import Optional, Any
from app.db.repository import repository

router = APIRouter()

@router.get("/{task_id}/status")
async def get_task_status(task_id: str):
    progress = repository.get_task_progress(task_id)
    if not progress:
        return {
            "success": True,
            "task_id": task_id,
            "material_id": "",
            "status": "pending",
            "progress_percentage": 10,
            "message": "Processing in queue...",
            "units_extracted": 0,
            "data": {
                "id": task_id,
                "status": "pending",
                "progress": 0.1,
                "units_extracted": 0,
                "message": "Processing in queue...",
            }
        }

    status_val = progress.get("status")
    status_str = status_val.value if hasattr(status_val, "value") else str(status_val)
    progress_pct = progress.get("progress_percentage", 0)
    units = progress.get("units_extracted", 0)
    msg = progress.get("message", "")
    mat_id = progress.get("material_id", "")

    return {
        "success": True,
        "task_id": task_id,
        "material_id": mat_id,
        "status": status_str,
        "progress_percentage": progress_pct,
        "message": msg,
        "units_extracted": units,
        "data": {
            "id": task_id,
            "material_id": mat_id,
            "status": status_str,
            "progress": round(progress_pct / 100.0, 2),
            "units_extracted": units,
            "message": msg,
        }
    }

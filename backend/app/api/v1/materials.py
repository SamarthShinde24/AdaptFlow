import uuid
from pathlib import Path
from typing import Optional, List, Any
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException, Query, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import bleach

from app.core.logging import logger
from app.models.material import Material as MaterialPydantic, MaterialType, ProcessingStatus
from app.db.repository import repository
from app.services.storage import storage_service
from app.services.ingestion import ingestion_service
from app.core.deps import get_optional_user, RateLimitDep
from app.db.session import get_db

router = APIRouter()


def _infer_material_type(filename: str, explicit_type: Optional[str] = None) -> MaterialType:
    if explicit_type:
        val = explicit_type.lower()
        if "textbook" in val or "pdf" in val:
            return MaterialType.TEXTBOOK
        elif "video" in val or "lecture" in val or "mp4" in val:
            return MaterialType.LECTURE_VIDEO
        elif "slide" in val or "deck" in val or "ppt" in val:
            return MaterialType.SLIDE_DECK

    ext = Path(filename).suffix.lower()
    if ext in {".mp4", ".m4v", ".webm", ".mov", ".mkv"}:
        return MaterialType.LECTURE_VIDEO
    elif ext in {".pptx", ".ppt"}:
        return MaterialType.SLIDE_DECK
    return MaterialType.TEXTBOOK


@router.get("", summary="List all uploaded study materials")
@router.get("/", summary="List all uploaded study materials")
async def list_materials(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    status: Optional[str] = Query(None, description="Filter by processing status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_optional_user),
):
    """
    Retrieves the list of all registered study materials.
    Returns both flat materials list and APIResponse data envelope for universal compatibility.
    """
    mat_type_enum = None
    if material_type and material_type != "all":
        try:
            mat_type_enum = MaterialType(material_type)
        except ValueError:
            pass

    materials = repository.list_materials(course_id=course_id, material_type=mat_type_enum)

    if status and status != "all":
        materials = [m for m in materials if (m.status.value if hasattr(m.status, "value") else str(m.status)) == status]

    materials_list = []
    for m in materials:
        m_dict = m.model_dump() if hasattr(m, "model_dump") else m.dict()
        # Ensure total_units_extracted is accurate
        units = repository.get_knowledge_units_by_material(m.id)
        m_dict["total_units_extracted"] = len(units) if units else (m_dict.get("total_units_extracted") or 0)
        # Ensure status is string
        if hasattr(m.status, "value"):
            m_dict["status"] = m.status.value
        if hasattr(m.material_type, "value"):
            m_dict["material_type"] = m.material_type.value
        materials_list.append(m_dict)

    paginated = materials_list[offset : offset + limit]

    return {
        "success": True,
        "total": len(materials_list),
        "materials": paginated,
        "data": {
            "total": len(materials_list),
            "materials": paginated,
        },
        "meta": {
            "total": len(materials_list),
            "limit": limit,
            "offset": offset,
        },
    }


@router.post(
    "/upload",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload multimodal study material (PDF textbook, lecture video, slide deck)",
)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="The study material file to parse"),
    title: str = Form(..., description="Human-readable title for the material"),
    material_type: Optional[str] = Form(None, description="Type: textbook, lecture_video, slide_deck"),
    course_id: Optional[str] = Form(None, description="Course identifier (e.g. CS101, BIO101)"),
    subject: Optional[str] = Form(None, description="Subject area (e.g. Biology, CS)"),
    chunk_size: Optional[int] = Form(None, description="Custom token chunk size"),
    chunk_overlap: Optional[int] = Form(None, description="Custom token overlap"),
    user=Depends(get_optional_user),
):
    """
    Uploads a study material file, validates format, persists to storage,
    and queues background parsing and source-tracking pipeline.
    """
    material_id = str(uuid.uuid4())
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    filename = file.filename or "uploaded_file"
    safe_title = bleach.clean(title).strip() or Path(filename).stem

    inferred_type = _infer_material_type(filename, material_type)
    logger.info(f"Receiving upload: '{safe_title}' ({inferred_type.value}) - file: {filename}")

    # 1. Save file to storage
    dest_path, file_size = await storage_service.save_upload_file(file, material_id, inferred_type)

    # 2. Register material in repository
    material = MaterialPydantic(
        id=material_id,
        title=safe_title,
        material_type=inferred_type,
        filename=filename,
        file_path=str(dest_path),
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        course_id=course_id or "BIO101",
        subject=subject or "Biology",
        status=ProcessingStatus.PENDING,
        status_message="Queued for multimodal parsing and source tracking.",
        user_id=str(user.id) if user and hasattr(user, "id") else "student_demo_1",
    )
    saved_material = repository.save_material(material)

    # 3. Initialize background task tracker
    repository.update_task_progress(
        task_id=task_id,
        material_id=material_id,
        status=ProcessingStatus.PENDING,
        progress=0,
        message="Queued for parsing.",
    )

    # 4. Schedule background ingestion
    background_tasks.add_task(
        ingestion_service.process_material,
        task_id=task_id,
        material=saved_material,
        file_path=dest_path,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    mat_dict = saved_material.model_dump() if hasattr(saved_material, "model_dump") else saved_material.dict()
    if hasattr(saved_material.status, "value"):
        mat_dict["status"] = saved_material.status.value
    if hasattr(saved_material.material_type, "value"):
        mat_dict["material_type"] = saved_material.material_type.value

    return {
        "success": True,
        "message": "Material successfully uploaded and queued for processing.",
        "material": mat_dict,
        "task_id": task_id,
        "check_status_url": f"/api/v1/tasks/{task_id}/status",
        "data": {
            "job_id": task_id,
            "task_id": task_id,
            "material_id": material_id,
            "material": mat_dict,
            "status": "queued",
        },
    }


@router.get("/{material_id}", summary="Get details of a specific study material")
async def get_material(material_id: str):
    material = repository.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")

    mat_dict = material.model_dump() if hasattr(material, "model_dump") else material.dict()
    units = repository.get_knowledge_units_by_material(material.id)
    mat_dict["total_units_extracted"] = len(units) if units else 0
    if hasattr(material.status, "value"):
        mat_dict["status"] = material.status.value
    if hasattr(material.material_type, "value"):
        mat_dict["material_type"] = material.material_type.value

    return {
        "success": True,
        "material": mat_dict,
        "data": mat_dict,
    }


@router.delete("/{material_id}", summary="Delete a study material")
async def delete_material(material_id: str):
    material = repository.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")

    storage_service.delete_material_files(material_id)
    repository.delete_material(material_id)

    return {
        "success": True,
        "message": f"Material '{material.title}' and associated knowledge units deleted successfully.",
        "data": {"id": material_id},
    }


@router.get("/status/{job_id}", summary="Get material ingestion status")
async def get_material_status(job_id: str):
    progress = repository.get_task_progress(job_id)
    if not progress:
        return {
            "success": True,
            "job_id": job_id,
            "status": "pending",
            "progress": 0.1,
            "units_extracted": 0,
            "data": {
                "id": job_id,
                "status": "pending",
                "progress": 0.1,
                "units_extracted": 0,
            },
        }
    status_val = progress.get("status")
    status_str = status_val.value if hasattr(status_val, "value") else str(status_val)
    progress_pct = progress.get("progress_percentage", 0)
    units = progress.get("units_extracted", 0)
    return {
        "success": True,
        "job_id": job_id,
        "status": status_str,
        "progress": round(progress_pct / 100.0, 2),
        "units_extracted": units,
        "data": {
            "id": job_id,
            "status": status_str,
            "progress": round(progress_pct / 100.0, 2),
            "units_extracted": units,
        },
    }

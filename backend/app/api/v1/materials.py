import uuid
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException, Query, status
from app.core.logging import logger
from app.models.material import Material, MaterialType, ProcessingStatus
from app.schemas.material import MaterialRead, MaterialUploadResponse, MaterialListResponse
from app.services.storage import storage_service
from app.services.ingestion import ingestion_service
from app.db.repository import repository

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.post(
    "/upload",
    response_model=MaterialUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload multimodal study material (PDF textbook, lecture video, slide deck)",
)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="The study material file to parse"),
    material_type: MaterialType = Form(..., description="Type of study material: textbook, lecture_video, or slide_deck"),
    title: str = Form(..., description="Human-readable title for the material"),
    course_id: Optional[str] = Form(None, description="Course identifier (e.g. CS101, BIO202)"),
    subject: Optional[str] = Form(None, description="Subject or topic area"),
    chunk_size: Optional[int] = Form(None, description="Custom token chunk size"),
    chunk_overlap: Optional[int] = Form(None, description="Custom token overlap"),
):
    """
    Uploads a study material file (PDF textbook, lecture video, or presentation slide deck),
    validates the file format, persists it to storage, and queues an asynchronous background
    parsing and source-tracking pipeline.
    """
    material_id = str(uuid.uuid4())
    task_id = f"task_{uuid.uuid4().hex[:12]}"

    logger.info(f"Receiving material upload: '{title}', type={material_type.value}, filename={file.filename}")

    # 1. Save file to storage
    dest_path, file_size = await storage_service.save_upload_file(file, material_id, material_type)

    # 2. Register material in repository
    material = Material(
        id=material_id,
        title=title,
        material_type=material_type,
        filename=file.filename or dest_path.name,
        file_path=str(dest_path),
        file_size_bytes=file_size,
        mime_type=file.content_type,
        course_id=course_id,
        subject=subject,
        status=ProcessingStatus.PENDING,
        status_message="Queued for multimodal parsing and source tracking.",
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

    # 4. Schedule background parsing job
    background_tasks.add_task(
        ingestion_service.process_material,
        task_id=task_id,
        material=saved_material,
        file_path=dest_path,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    return MaterialUploadResponse(
        message="Material successfully uploaded and queued for processing.",
        material=MaterialRead(**saved_material.model_dump()),
        task_id=task_id,
        check_status_url=f"/api/v1/tasks/{task_id}/status",
    )


@router.get(
    "",
    response_model=MaterialListResponse,
    summary="List all uploaded study materials",
)
def list_materials(
    course_id: Optional[str] = Query(None, description="Filter by course ID"),
    material_type: Optional[MaterialType] = Query(None, description="Filter by material type"),
):
    """Retrieves a list of all registered study materials and their current parsing statuses."""
    materials = repository.list_materials(course_id=course_id, material_type=material_type)
    return MaterialListResponse(
        total=len(materials),
        materials=[MaterialRead(**m.model_dump()) for m in materials],
    )


@router.get(
    "/{material_id}",
    response_model=MaterialRead,
    summary="Get details of a specific study material",
)
def get_material(material_id: str):
    """Retrieves metadata and status for a single study material."""
    material = repository.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")
    return MaterialRead(**material.model_dump())


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a study material and its extracted knowledge base units",
)
def delete_material(material_id: str):
    """Deletes the material, its source files on disk, and all extracted knowledge base units."""
    material = repository.get_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material with ID '{material_id}' not found.")

    storage_service.delete_material_files(material_id)
    repository.delete_material(material_id)

    return {"message": f"Material '{material.title}' and associated knowledge units deleted successfully."}

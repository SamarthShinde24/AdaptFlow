from fastapi import APIRouter, HTTPException
from app.schemas.task import TaskStatusResponse
from app.db.repository import repository

router = APIRouter(prefix="/tasks", tags=["Ingestion Tasks"])


@router.get(
    "/{task_id}/status",
    response_model=TaskStatusResponse,
    summary="Get status of an asynchronous parsing and ingestion task",
)
def get_task_status(task_id: str):
    """Polls the status of an ongoing multimodal parsing job."""
    task = repository.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with ID '{task_id}' not found.")
    return TaskStatusResponse(**task)

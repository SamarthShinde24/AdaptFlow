from fastapi import APIRouter
from app.api.v1.materials import router as materials_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.chat import router as chat_router
from app.api.v1.quiz import router as quiz_router

api_v1_router = APIRouter()
api_v1_router.include_router(materials_router)
api_v1_router.include_router(knowledge_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(quiz_router)

__all__ = ["api_v1_router"]

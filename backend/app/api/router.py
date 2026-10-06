from fastapi import APIRouter
from app.api.v1 import auth, materials, chat, quiz, assignments, subjects, knowledge, tasks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat & RAG"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["Adaptive Quiz"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Processing Tasks"])

main_router = api_router
__all__ = ["api_router", "main_router"]

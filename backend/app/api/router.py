from fastapi import APIRouter
from app.core.config import settings
from app.api.v1 import api_v1_router

main_router = APIRouter()
main_router.include_router(api_v1_router, prefix=settings.API_V1_STR)

__all__ = ["main_router"]

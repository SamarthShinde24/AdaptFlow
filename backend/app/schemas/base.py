from typing import Generic, TypeVar, Any
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: str | None = None
    meta: dict[str, Any] | None = None
    
    model_config = ConfigDict(from_attributes=True)

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

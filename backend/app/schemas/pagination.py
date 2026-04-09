from pydantic import BaseModel
from typing import List
from app.db.models import Routes


class PaginatedRoutesResponse(BaseModel):
    class Config:
        arbitrary_types_allowed = True  # Разрешаем любые типы

    items: List[Routes]
    total: int
    page: int
    per_page: int
    total_pages: int

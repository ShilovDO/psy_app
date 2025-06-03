from pydantic import BaseModel, EmailStr
from typing import Optional, List, TypeVar, Generic
from models import Routes

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    mail: EmailStr
    password: str
    remember: bool

class UserRegistration(BaseModel):
    username: str
    mail: EmailStr
    password: str
    admin: bool

class User(BaseModel):
    id: int
    username: str
    mail: EmailStr
    admin: bool

class FullUser(BaseModel):
    id: int
    username: str
    mail: EmailStr
    password: str
    admin: bool

class NewService(BaseModel):
    name: str
    url: str
    available: bool
    admin: bool
    instruction: str

class Service(BaseModel):
    id: int
    name: str
    url: str
    available: bool
    admin: bool
    instruction: str

class NewRoute(BaseModel):
    name: str

class Route(BaseModel):
    id: int

class NewStation(BaseModel):
    route_id: int
    number: int
    next: int
    entry: bool
    service: int
    description: str

class PaginatedRoutesResponse(BaseModel):
    class Config:
        arbitrary_types_allowed = True  # Разрешаем любые типы
    items: List[Routes]
    total: int
    page: int
    per_page: int
    total_pages: int

class ID(BaseModel):
    id: int

class UserInDB(UserRegistration):
    id: int
    
    class Config:
        orm_mode = True

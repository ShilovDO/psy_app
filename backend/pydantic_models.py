from pydantic import BaseModel, EmailStr
from typing import Optional, List, TypeVar, Generic
from models import Routes, Configs
from datetime import datetime

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

class NewResult(BaseModel):
    station: int
    config: int
    route: int
    date_time: datetime

class NewRoute(BaseModel):
    name: str

class Route(BaseModel):
    id: int

class ChangeRoute(BaseModel):
    id: int
    name: str

class NewStation(BaseModel):
    route_id: int
    number: int
    next: int
    entry: bool
    config: int
    description: str

class ChangeStation(BaseModel):
    id: int
    number: int
    next: int
    config: int
    description: str
    entry: bool

class NewConfig(BaseModel):
    name: str
    description: str
    service: int

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

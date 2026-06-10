from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    mail: EmailStr
    password: str
    remember: bool


class UserRegistration(BaseModel):
    username: str
    mail: EmailStr
    password: str
    admin: Optional[bool] = None
    active: Optional[bool] = None


class User(BaseModel):
    id: int
    username: str
    mail: EmailStr
    admin: Optional[bool] = None
    active: Optional[bool] = None

class FullUser(BaseModel):
    id: int
    username: str
    mail: EmailStr
    password: str
    admin: Optional[bool] = None
    active: Optional[bool] = None

class ID(BaseModel):
    id: int

class UsersResponse(BaseModel):
    id: int
    username: str
    mail: str
    admin: Optional[bool] = None
    photo: Optional[str] = None
    active: Optional[bool] = None


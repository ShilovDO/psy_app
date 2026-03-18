from pydantic import BaseModel, EmailStr

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

class ID(BaseModel):
    id: int
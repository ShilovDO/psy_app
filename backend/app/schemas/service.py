from pydantic import BaseModel


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

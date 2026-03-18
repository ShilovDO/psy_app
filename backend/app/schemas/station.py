from pydantic import BaseModel

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
from pydantic import BaseModel

class NewConfig(BaseModel):
    name: str
    description: str
    service: int
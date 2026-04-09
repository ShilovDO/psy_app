from pydantic import BaseModel


class NewRoute(BaseModel):
    name: str


class Route(BaseModel):
    id: int


class ChangeRoute(BaseModel):
    id: int
    name: str

class ShareRouteRequest(BaseModel):
    route_id: int
    user_id: int
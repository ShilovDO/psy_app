from pydantic import BaseModel
from datetime import datetime


class NewResult(BaseModel):
    station: int
    config: int
    route: int
    date_time: datetime

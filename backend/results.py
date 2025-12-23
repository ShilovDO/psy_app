import sys
import traceback
from fastapi import Depends, HTTPException, status, Request
from pydantic_models import NewResult
from models import Results

async def create_result(route: NewResult, request: Request, db):
    user_id = request.state.user.id
    new_result = Results(
        user=user_id,
        station=route.station,
        config=route.config,
        route=route.route,
        date_time=route.date_time
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    return new_result
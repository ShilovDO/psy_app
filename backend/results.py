import sys
import traceback
from fastapi import Depends, HTTPException, status, Request
from pydantic_models import NewResult
from models import Results, Configs, Services

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

async def all_result(field: str, config: int, route: int, user: int, direction: str, db, page: int = 1, per_page: int = 10):
    offset = (page - 1) * per_page
    # Базовый запрос
    query = (
    db.query(
        Results,
        Services.url.label('url')
    )
    .join(Configs, Configs.id == Results.config)
    .join(Services, Services.id == Configs.service)
)

    # Фильтрация
    if config != 0:
        query = query.filter(Results.config == config)
    if route != 0:
        query = query.filter(Results.route == route)
    if user != 0:
        query = query.filter(Results.user == user)

    # Общее количество с учетом фильтров
    total = query.count()

    # Сортировка
    if field == "id":
        if direction == "desc":
            query = query.order_by(Results.id.desc())
        else:
            query = query.order_by(Results.id)

    # Пагинация
    results = query.offset(offset).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page

    items = []

    for result_obj, url in results:
        result_dict = result_obj.__dict__.copy()

        # Убираем служебное поле SQLAlchemy
        result_dict.pop('_sa_instance_state', None)

        # Добавляем данные из JOIN
        result_dict.update({
            "url": url
        })

        items.append(result_dict)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
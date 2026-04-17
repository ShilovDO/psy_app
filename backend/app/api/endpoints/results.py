from fastapi import Request, Depends, APIRouter, HTTPException, status
from app.schemas.result import NewResult
from app.db.models import Results, Configs, Services, Routes
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from app.schemas.user import ID

router = APIRouter()

@router.post("/create_result")
async def create_result(
    route: NewResult, request: Request, db: Session = Depends(get_db)
):
    user_id = request.state.user.id
    new_result = Results(
        user=user_id,
        station=route.station,
        config=route.config,
        route=route.route,
        date_time=route.date_time,
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    return new_result

@router.post("/delete_result")
async def delete_config(result_id: ID, db: Session = Depends(get_db)):
    check_result = db.query(Results).filter(Results.id == result_id.id).first()
    if check_result:
        result = db.query(Configs).filter(Configs.id == result_id.id).delete()
        return check_result
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удаётся удалить результат. Попробуйте в другой раз...",
        )

@router.get("/all_result")
async def all_result(
    field: str,
    config: int,
    route: int,
    user: int,
    direction: str,
    request: Request,
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 10,
):
    offset = (page - 1) * per_page
    user_id = request.state.user.id
    # Базовый запрос
    query = (
        db.query(Results, Services.url.label("url"), Routes.owner.label("owner"))
        .join(Routes, Routes.id == Results.route)
        .join(Configs, Configs.id == Results.config)
        .join(Services, Services.id == Configs.service)
        .filter(Routes.owner == user_id)
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

    for result_obj, url, owner in results:
        result_dict = result_obj.__dict__.copy()

        # Убираем служебное поле SQLAlchemy
        result_dict.pop("_sa_instance_state", None)

        # Добавляем данные из JOIN
        result_dict.update({"url": url, "owner": owner})

        items.append(result_dict)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }

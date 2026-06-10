from fastapi import HTTPException, status, Request, Depends, APIRouter
from app.schemas.route import NewRoute, Route, ChangeRoute, ShareRouteRequest
from app.schemas.user import ID
from app.db.models import Routes, UsersRoutes, Users
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_, case

router = APIRouter()

@router.post("/add_route")
async def create_route(
    route: NewRoute, request: Request, db: Session = Depends(get_db)
):
    user_id = request.state.user.id
    new_route = Routes(name=route.name, owner=user_id, visible=True)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route


@router.get("/get_route/{route_id}")
async def get_route(route_id: int, db: Session = Depends(get_db)):
    find_route = db.query(Routes).filter(Routes.id == route_id).first()
    return find_route


@router.post("/delete_route")
async def delete_route(route: Route, request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id

    check_route = db.query(Routes).filter(Routes.id == route.id, Routes.owner == user_id).first()

    if check_route:
        check_route.visible = not check_route.visible
        db.commit()
        db.refresh(check_route)
        return check_route
    else:
        check_route = db.query(UsersRoutes).filter(UsersRoutes.route_id == route.id, UsersRoutes.user_id == user_id).first()
        if check_route:
            check_route.visible = not check_route.visible
            db.commit()
            db.refresh(check_route)
            return check_route
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, message="Route doesn't exists"
            )


@router.get("/all_route")
async def all_route(
    request: Request,
    visibleParam: str,
    routeType: str,
    field: str,
    direction: str,
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 10,
):
    user_id = request.state.user.id
    offset = (page - 1) * per_page

    visible_map = {"hided": False, "visibled": True, "all": None}
    visible = visible_map.get(visibleParam)

    # Базовый запрос с LEFT JOIN и вычисляемыми полями
    query = db.query(
        Routes,
        (Routes.owner == user_id).label("is_owner"),
        case(
            (UsersRoutes.user_id == user_id, UsersRoutes.visible),
            else_=Routes.visible
        ).label("effective_visible")
    ).outerjoin(
        UsersRoutes,
        (UsersRoutes.route_id == Routes.id) & (UsersRoutes.user_id == user_id)
    ).filter(
        # Показываем маршруты, где пользователь либо владелец, либо приглашён
        or_(
            Routes.owner == user_id,
            UsersRoutes.user_id == user_id
        )
    )

    # Фильтрация по типу маршрута (own / shared / all)
    if routeType == "own":
        query = query.filter(Routes.owner == user_id)
    elif routeType == "shared":
        query = query.filter(
            Routes.owner != user_id,
            UsersRoutes.user_id == user_id
        )
    # routeType == "all" – ничего не добавляем

    # Фильтрация по видимости с учётом роли
    if visible is not None:
        query = query.filter(
            or_(
                (Routes.owner == user_id) & (Routes.visible == visible),
                (UsersRoutes.user_id == user_id) & (UsersRoutes.visible == visible)
            )
        )

    # Сортировка
    if field == "name":
        order_col = Routes.name
    else:
        order_col = Routes.id
    if direction == "desc":
        order_col = order_col.desc()

    query = query.order_by(order_col)

    # Общее количество записей
    total = query.count()

    # Пагинация
    results = query.offset(offset).limit(per_page).all()

    # Формируем ответ
    items = []
    for route, is_owner, effective_visible in results:
        route.visible = effective_visible
        route.is_owner = is_owner
        items.append(route)

    total_pages = (total + per_page - 1) // per_page

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.post("/change_route")
async def change_route(route: ChangeRoute, db: Session = Depends(get_db)):
    try:
        # Находим станцию
        existing_route = db.query(Routes).filter(Routes.id == route.id).first()

        if not existing_route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
            )

        existing_route.name = route.name

        db.commit()
        return existing_route

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/share_route")
async def share_route(request: Request, share: ShareRouteRequest, db: Session = Depends(get_db)):
    check_route = db.query(Routes).filter(Routes.id == share.route_id).first()
    if check_route.owner != request.state.user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Маршрут не принадлежит вам"
        )
    check_share = db.query(UsersRoutes).filter(
        UsersRoutes.route_id == share.route_id, 
        UsersRoutes.user_id == share.user_id
    ).first()   
    if check_share:
        db.delete(check_share)
        db.commit()
        return {"message": "Маршрут удалён из общего доступа"}
    else:
        shared_route = UsersRoutes(user_id=share.user_id, route_id=share.route_id, visible=True)
        db.add(shared_route)
        db.commit()
        db.refresh(shared_route)
        return shared_route


@router.get("/users_in_route")
async def all_route(
    route: Route,
    direction: str,
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 10,
):
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Формируем базовый запрос
    base_query = (
        db.query(UsersRoutes, Users)
        .filter(UsersRoutes.route_id == route.id)
        .join(Users, Users.id == UsersRoutes.user_id)
    )

    # Получаем общее количество записей
    total = base_query.count()

    # Определяем сортировку по имени пользователя
    order_column = Users.username
    if direction == "desc":
        order_column = order_column.desc()

    # Получаем пагинированный список с сортировкой
    results = base_query.order_by(order_column).offset(offset).limit(per_page).all()

    # Парсим результаты в читаемый формат
    items = []
    for user_route, user in results:
        items.append({"id": user.id, "username": user.username, "mail": user.mail})

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }
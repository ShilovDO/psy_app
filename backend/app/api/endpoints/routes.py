from fastapi import HTTPException, status, Request, Depends, APIRouter
from app.schemas.route import NewRoute, Route, ChangeRoute
from app.schemas.user import ID
from app.db.models import Routes, Stations, UsersRoutes
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/add_route")
async def create_route(route: NewRoute, request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id
    new_route = Routes(
        name=route.name,
        owner=user_id,
        visible = True
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

@router.get("/get_route/{route_id}")
async def get_route(route_id: int, db: Session = Depends(get_db)):
    find_route = db.query(Routes).filter(Routes.id == route_id).first()
    return find_route

@router.post("/delete_route")
async def delete_route(route: Route, db: Session = Depends(get_db)):
    check_route = db.query(Routes).filter(Routes.id == route.id).first()
    if check_route:
        check_route.visible = not check_route.visible
        db.commit()
        db.refresh(check_route)
        return check_route
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Route doesn't exists"
        )

@router.get("/all_route")
async def all_route(request: Request, visibleParam: str, field: str, direction: str, db: Session = Depends(get_db), page: int = 1, per_page: int = 10):
    user_id = request.state.user.id
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Определяем видимость
    visible_map = {
        "hided": False,
        "visibled": True,
        "all": None
    }
    visible = visible_map.get(visibleParam)

    # Формируем базовый запрос
    base_query = db.query(Routes).filter(Routes.owner == user_id)
    if visible is not None:  # visibleParam не равен "all"
        base_query = base_query.filter(Routes.visible == visible)

    # Получаем общее количество маршрутов
    total = base_query.count()

    # Определяем сортировку
    order_column = Routes.name if field == "name" else Routes.id
    if direction == "desc":
        order_column = order_column.desc()

    # Получаем пагинированный список маршрутов с сортировкой
    routes = base_query.order_by(order_column).offset(offset).limit(per_page).all()

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    return {
        "items": routes,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.post("/change_route")
async def change_route(route: ChangeRoute, db: Session = Depends(get_db)):
    try:
        # Находим станцию
        existing_route = db.query(Routes).filter(Routes.id == route.id).first()

        if not existing_route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Route not found"
            )

        existing_route.name = route.name

        db.commit()
        return existing_route
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/share_route")
async def share_route(route: Route, user: ID, db: Session = Depends(get_db)):
    shared_route = UsersRoutes(
        user_id=user.id,
        route_id=route.id,
        visible = True
    )
    db.add(shared_route)
    db.commit()
    db.refresh(shared_route)
    return shared_route

@router.get("/users_in_route")
async def all_route(route: Route, direction: str, db: Session = Depends(get_db), page: int = 1, per_page: int = 10):
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Формируем базовый запрос
    base_query = db.query(UsersRoutes, Users).filter(
        UsersRoutes.route_id == route.id
    ).join(Users, Users.id == UsersRoutes.user_id)

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
        items.append({
            "id": user.id,
            "username": user.username,
            "mail": user.mail
        })

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
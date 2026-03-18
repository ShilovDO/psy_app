from fastapi import HTTPException, status, Request, Depends, APIRouter
from app.schemas.route import NewRoute, Route, ChangeRoute
from app.db.models import Routes, Stations
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/add_route")
async def create_route(route: NewRoute, request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id
    new_route = Routes(
        name=route.name,
        owner=user_id
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
        check_stations = db.query(Stations).filter(Stations.route == route.id).first()
        if check_stations:
            db.query(Stations).filter(Stations.route == route.id).delete()
        user_route = db.query(Routes).filter(Routes.id == route.id).delete()
        return user_route
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Route doesn't exists"
        )

@router.get("/all_route")
async def all_route(request: Request, field: str, direction: str, db: Session = Depends(get_db), page: int = 1, per_page: int = 10):
    user_id = request.state.user.id
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Получаем общее количество маршрутов
    total = db.query(Routes).filter(Routes.owner == user_id).count()
    print(field + " || " + direction)
    # Получаем пагинированный список маршрутов
    if(field == "name" and direction == "asc"):
        print('Вход1')
        routes = db.query(Routes).filter(Routes.owner == user_id).order_by(Routes.name).offset(offset).limit(per_page).all()
    elif(field == "name" and direction == "desc"):
        print('Вход2')
        routes = db.query(Routes).filter(Routes.owner == user_id).order_by(Routes.name.desc()).offset(offset).limit(per_page).all()
    elif(field == "id" and direction == "asc"):
        routes = db.query(Routes).filter(Routes.owner == user_id).order_by(Routes.id).offset(offset).limit(per_page).all()
    elif(field == "id" and direction == "desc"):
        routes = db.query(Routes).filter(Routes.owner == user_id).order_by(Routes.id.desc()).offset(offset).limit(per_page).all()
    else:
        routes = db.query(Routes).filter(Routes.owner == user_id).offset(offset).limit(per_page).all()

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
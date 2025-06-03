from fastapi import Depends, HTTPException, status, Request
from pydantic_models import NewRoute, NewStation, Route
from models import Services, Routes, Stations

async def create_route(route: NewRoute, request: Request, db):
    user_id = request.state.user.id
    new_route = Routes(
        name=route.name,
        owner=user_id
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

async def get_route(route: Route, db):
    find_route = db.query(Routes).filter(Routes.id == route.id).first()
    return find_route

async def add_station(service: NewStation, db):
    try:
        new_service = Stations(
            route=service.route_id,
            number=service.number,
            next=service.next,
            entry=service.entry,
            service=service.service
        )
        db.add(new_service)
        db.commit()
        db.refresh(new_service)
        return new_service
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Error adding a record to the database"
        )

async def delete_route(route: Route, db):
    check_route = db.query(Routes).filter(Routes.id == route.id).first()
    if check_route:
        check_stations = db.query(Stations).filter(Stations.route == route.id).first()
        if check_stations:
            db.query(Stations).filter(Stations.route == route.id).delete()
        user_route = db.query(Routes).filter(Routes.id == route.id).delete()
        return check_route
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Route doesn't exists"
        )

async def all_route(request: Request, field: str, direction: str, db, page: int = 1, per_page: int = 10):
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


async def change_station(station: NewStation, db):
    try:
        # Находим станцию
        existing_station = db.query(Stations).filter(
            Stations.route == station.route_id,
            Stations.number == station.number
        ).first()

        if not existing_station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Station not found"
            )

        # Обновляем поля
        if station.next is not None:
            existing_station.next = station.next
        if station.entry is not None:
            existing_station.entry = station.entry
        if station.service is not None:
            existing_station.service = station.service

        db.commit()
        return existing_station
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

async def all_station(route_id: int, db):
    stations_with_services = db.query(
        Stations,
        Services.name.label('service_name'),
        Services.url.label('url'),
        Services.available.label('available'),
    ).join(
        Services, Stations.service == Services.id
    ).filter(
        Stations.route == route_id
    ).order_by(Stations.number).all()


    result = []
    for station, service_name, url, available in stations_with_services:
        station_dict = {
            **station.__dict__,
            "service_name": service_name,
            "url": url,
            "available": available,
        }

        station_dict.pop('_sa_instance_state', None)
        result.append(station_dict)

    return result

async def get_route(db, route_id: int):
    route = db.query(Routes).filter(Routes.id == route_id).first()
    print(route.name)
    return route
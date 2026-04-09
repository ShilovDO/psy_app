import traceback
from fastapi import HTTPException, status, Depends, APIRouter
from app.schemas.route import Route
from app.schemas.station import NewStation, ChangeStation
from app.db.models import Services, Stations, Configs
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/add_station")
async def add_station(station: NewStation, db: Session = Depends(get_db)):
    try:
        new_station = Stations(
            route=station.route_id,
            number=station.number,
            next=station.next,
            entry=station.entry,
            config=station.config,
            description=station.description,
        )
        db.add(new_station)
        db.commit()
        db.refresh(new_station)
        return new_station
    except Exception as e:
        # Получаем полный traceback
        error_traceback = traceback.format_exc()

        # Логируем в консоль (в продакшене используйте нормальное логирование)
        print(f"Full error traceback:\n{error_traceback}")

        # Поднимаем исключение с информацией об ошибке
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error adding a record to the database: {str(e)}",
        )


@router.post("/delete_station")
async def delete_station(station: Route, db: Session = Depends(get_db)):
    check_stations = db.query(Stations).filter(Stations.id == station.id).first()
    if check_stations:
        user_stations = db.query(Stations).filter(Stations.id == station.id).delete()
        return user_stations
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, message="Route doesn't exists"
        )


@router.post("/change_station")
async def change_station(station: ChangeStation, db: Session = Depends(get_db)):
    try:
        # Находим станцию
        existing_station = db.query(Stations).filter(Stations.id == station.id).first()

        if not existing_station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Station not found"
            )
        # Обновляем поля
        if station.number is not None:
            existing_station.number = station.number
        if station.next is not None:
            existing_station.next = station.next
        if station.config is not None:
            existing_station.config = station.config
        if station.description is not None:
            existing_station.description = station.description
        if station.entry is not None:
            existing_station.entry = station.entry

        db.commit()
        return existing_station

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/all_station/{route_id}")
async def all_station(route_id: int, db: Session = Depends(get_db)):
    stations_with_services = (
        db.query(
            Stations,
            Configs.name.label("config_name"),
            Configs.description.label("config_description"),
            Configs.id.label("config_id"),
            Services.name.label("service_name"),
            Services.url.label("url"),
            Services.available.label("available"),
            Services.admin.label("admin"),
        )
        .join(Configs, Stations.config == Configs.id)
        .join(Services, Configs.service == Services.id)
        .filter(Stations.route == route_id)
        .order_by(Stations.number)
        .all()
    )

    result = []
    for (
        station,
        config_name,
        config_description,
        config_id,
        service_name,
        url,
        available,
        admin,
    ) in stations_with_services:
        station_dict = station.__dict__.copy()
        # Добавляем дополнительные поля
        station_dict.update(
            {
                "config_name": config_name,
                "config_description": config_description,
                "config_id": config_id,
                "service_name": service_name,
                "url": url,
                "available": available,
                "admin": admin,
            }
        )
        # Удаляем внутренний атрибут SQLAlchemy
        station_dict.pop("_sa_instance_state", None)
        result.append(station_dict)
    return result

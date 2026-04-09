from fastapi import HTTPException, status, Request, Depends, APIRouter
from app.schemas.service import NewService, Service
from app.db.models import Services, Configs
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/add_service")
async def create_service(
    service: NewService, request: Request, db: Session = Depends(get_db)
):
    new_service = Services(
        name=service.name,
        url=service.url,
        available=service.available,
        admin=service.admin,
        instruction=service.instruction,
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    if not service.admin:
        config = Configs(
            name=service.name,
            description=service.instruction,
            owner=None,
            service=new_service.id,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return new_service


@router.post("/change_service")
async def change_service(service: Service, db: Session = Depends(get_db)):
    user_service = db.query(Services).filter(Services.id == service.id).first()
    if user_service:
        user_service.name = service.name
        user_service.url = service.url
        user_service.available = service.available
        user_service.admin = service.admin
        user_service.instruction = service.instruction
        db.commit()
        db.refresh(user_service)
        return user_service
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удалось изменить настройки сервиса. Попробуйте в другой раз...",
        )


@router.post("/delete_service")
async def delete_service(service: Service, db: Session = Depends(get_db)):
    check_service = db.query(Services).filter(Services.id == service.id).first()
    print(check_service)
    if check_service:
        user_service = db.query(Services).filter(Services.id == service.id).delete()
        return check_service
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удаётся удалить сервис. Попролбуйте в другой раз...",
        )


@router.get("/all_service")
async def all_service(
    field, direction, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)
):
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Получаем общее количество сервисов
    total = db.query(Services).count()

    # Получаем пагинированный список сервисов
    if field == "name" and direction == "asc":
        services = (
            db.query(Services)
            .order_by(Services.name)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "name" and direction == "desc":
        services = (
            db.query(Services)
            .order_by(Services.name.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "id" and direction == "asc":
        services = (
            db.query(Services)
            .order_by(Services.id)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "id" and direction == "desc":
        services = (
            db.query(Services)
            .order_by(Services.id.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "available" and direction == "asc":
        services = (
            db.query(Services)
            .order_by(Services.available)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "available" and direction == "desc":
        services = (
            db.query(Services)
            .order_by(Services.available.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    else:
        services = db.query(Services).offset(offset).limit(per_page).all()

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    return {
        "items": services,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/available_service")
async def available_service(
    field, direction, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)
):
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Получаем общее количество сервисов
    total = db.query(Services).filter(Services.available == True).count()

    # Получаем пагинированный список сервисов
    if field == "name" and direction == "asc":
        services = (
            db.query(Services)
            .filter(Services.available == True)
            .order_by(Services.name)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "name" and direction == "desc":
        services = (
            db.query(Services)
            .filter(Services.available == True)
            .order_by(Services.name.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "id" and direction == "asc":
        services = (
            db.query(Services)
            .filter(Services.available == True)
            .order_by(Services.id)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "id" and direction == "desc":
        services = (
            db.query(Services)
            .filter(Services.available == True)
            .order_by(Services.id.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    else:
        services = (
            db.query(Services)
            .filter(Services.available == True)
            .offset(offset)
            .limit(per_page)
            .all()
        )

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    return {
        "items": services,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/configurable_service")
async def configurable_service(db: Session = Depends(get_db)):
    services = db.query(Services).filter(Services.admin == True).all()
    return {"items": services}

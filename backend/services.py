from passlib.context import CryptContext
from starlette import status
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic_models import TokenData, UserLogin, UserRegistration, NewService, Service, ID, NewConfig
from models import Users
from database import SessionLocal
from fastapi import Response  # Импортируем Response
from models import Services, Configs


async def create_service(service: NewService, db):
    new_service = Services(
        name=service.name,
        url=service.url,
        available=service.available,
        admin=service.admin,
        instruction=service.instruction
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service
    
async def change_service(service: Service, db):
    user_service = db.query(Services).filter(Services.id == service.id).first()
    if user_service:
        user_service.name = service.name
        user_service.url = service.url
        user_service.available = service.available
        user_service.admin=service.admin
        user_service.instruction=service.instruction
        db.commit()
        db.refresh(user_service)
        return user_service
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удалось изменить настройки сервиса. Попробуйте в другой раз..."
        )

async def delete_service(service: Service, db):
    check_service = db.query(Services).filter(Services.id == service.id).first()
    print(check_service)
    if check_service:
        user_service = db.query(Services).filter(Services.id == service.id).delete()
        return check_service
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удаётся удалить сервис. Попролбуйте в другой раз..."
        )

async def all_service(db, field, direction, page: int = 1, per_page: int = 10):
    # Вычисляем смещение
    offset = (page - 1) * per_page
    
    # Получаем общее количество сервисов
    total = db.query(Services).count()

    # Получаем пагинированный список сервисов
    if (field == "name" and direction == "asc"):
        services = db.query(Services).order_by(Services.name).offset(offset).limit(
            per_page).all()
    elif (field == "name" and direction == "desc"):
        services = db.query(Services).order_by(Services.name.desc()).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "asc"):
        services = db.query(Services).order_by(Services.id).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "desc"):
        services = db.query(Services).order_by(Services.id.desc()).offset(offset).limit(
            per_page).all()
    elif (field == "available" and direction == "asc"):
        services = db.query(Services).order_by(Services.available).offset(offset).limit(
            per_page).all()
    elif (field == "available" and direction == "desc"):
        services = db.query(Services).order_by(Services.available.desc()).offset(offset).limit(
            per_page).all()
    else:
        services = db.query(Services).offset(offset).limit(per_page).all()
    
    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": services,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

async def create_config(config: NewConfig, request: Request, db):
    user_id = request.state.user.id
    new_config = Configs(
        name=config.name,
        description=config.description,
        owner=user_id,
        service=config.service
    )
    print(new_config)
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

async def delete_config(config_id: ID, db):
    check_config = db.query(Configs).filter(Configs.id == config_id.id).first()
    if check_config:
        config = db.query(Configs).filter(Configs.id == config_id.id).delete()
        return config
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удаётся удалить сервис. Попролбуйте в другой раз..."
        )

async def all_config(db, sort, field, direction, page: int = 1, per_page: int = 10):
    # Вычисляем смещение
    offset = (page - 1) * per_page
    
    # Получаем общее количество сервисов
    total = db.query(Configs).count()

    # Получаем пагинированный список сервисов
    if (sort == 0):
        if (field == "name" and direction == "asc"):
            services = db.query(Configs).order_by(Configs.name).offset(offset).limit(
                per_page).all()
        elif (field == "name" and direction == "desc"):
            services = db.query(Configs).order_by(Configs.name.desc()).offset(offset).limit(
                per_page).all()
        elif (field == "id" and direction == "asc"):
            services = db.query(Configs).order_by(Configs.id).offset(offset).limit(
                per_page).all()
        elif (field == "id" and direction == "desc"):
            services = db.query(Configs).order_by(Configs.id.desc()).offset(offset).limit(
                per_page).all()
        else:
            services = db.query(Configs).offset(offset).limit(per_page).all()
    else:
        if (field == "name" and direction == "asc"):
            services = db.query(Configs).filter(Configs.service == sort).order_by(Configs.name).offset(offset).limit(
                per_page).all()
        elif (field == "name" and direction == "desc"):
            services = db.query(Configs).filter(Configs.service == sort).order_by(Configs.name.desc()).offset(offset).limit(
                per_page).all()
        elif (field == "id" and direction == "asc"):
            services = db.query(Configs).filter(Configs.service == sort).order_by(Configs.id).offset(offset).limit(
                per_page).all()
        elif (field == "id" and direction == "desc"):
            services = db.query(Configs).filter(Configs.service == sort).order_by(Configs.id.desc()).offset(offset).limit(
                per_page).all()
        else:
            services = db.query(Configs).filter(Configs.service == sort).offset(offset).limit(per_page).all()
    
    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": services,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

async def available_service(db, field, direction, page: int = 1, per_page: int = 10):
    # Вычисляем смещение
    offset = (page - 1) * per_page
    
    # Получаем общее количество сервисов
    total = db.query(Services).filter(Services.available == True).count()
    
    # Получаем пагинированный список сервисов
    if (field == "name" and direction == "asc"):
        services = db.query(Services).filter(Services.available == True).order_by(Services.name).offset(offset).limit(
            per_page).all()
    elif (field == "name" and direction == "desc"):
        services = db.query(Services).filter(Services.available == True).order_by(Services.name.desc()).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "asc"):
        services = db.query(Services).filter(Services.available == True).order_by(Services.id).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "desc"):
        services = db.query(Services).filter(Services.available == True).order_by(Services.id.desc()).offset(offset).limit(
            per_page).all()
    else:
        services = db.query(Services).filter(Services.available == True).offset(offset).limit(per_page).all()

    
    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": services,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
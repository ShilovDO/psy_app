from starlette import status
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.schemas.config import NewConfig
from app.schemas.user import ID
from app.db.models import Services, Configs
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/add_config")
async def create_config(config_data: NewConfig, request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id
    
    # Создаём новую конфигурацию
    new_config = Configs(
        name=config_data.name,
        description=config_data.description,
        owner=user_id,
        service=config_data.service
    )
    
    print(f"Creating new config: {new_config}")
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    print(f"Created config with ID: {new_config.id}")
    
    # Получаем информацию о созданной конфигурации вместе с URL сервиса
    result = db.query(
        Configs, 
        Services.url.label('url')
    ).join(
        Services, Configs.service == Services.id
    ).filter(
        Configs.id == new_config.id
    ).first()  # Используем first(), так как ID уникален
    
    if result:
        config, url = result
        response_data = {
            "id": config.id,
            "name": config.name,
            "service": config.service,
            "owner": config.owner,
            "description": config.description,
            "url": url
        }
    else:
        # Если по какой-то причине не нашли, возвращаем базовые данные
        response_data = {
            "id": new_config.id,
            "name": new_config.name,
            "service": new_config.service,
            "owner": new_config.owner,
            "description": new_config.description,
            "url": None
        }
    
    return response_data

@router.post("/delete_config")
async def delete_config(config_id: ID, db: Session = Depends(get_db)):
    check_config = db.query(Configs).filter(Configs.id == config_id.id).first()
    if check_config:
        config = db.query(Configs).filter(Configs.id == config_id.id).delete()
        return config
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="Не удаётся удалить сервис. Попролбуйте в другой раз..."
        )

@router.get("/all_config")
async def all_config(request: Request, sort, field, direction, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)):
    user_id = request.state.user.id

    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Получаем общее количество конфигураций пользователя
    total = db.query(Configs).filter(Configs.owner == user_id).count()

    # Проверим, есть ли вообще конфигурации у пользователя
    all_user_configs = db.query(Configs).filter(Configs.owner == user_id).all()

    # Базовый запрос с фильтром по пользователю
    base_query = db.query(Configs, Services.url.label('url')).join(
        Services, Configs.service == Services.id
    ).filter(Configs.owner == user_id)

    # Применяем сортировку в зависимости от параметров
    if sort == 0 or sort == "0":
        if field == "name" and direction == "asc":
            query = base_query.order_by(Configs.name)
        elif field == "name" and direction == "desc":
            query = base_query.order_by(Configs.name.desc())
        elif field == "id" and direction == "asc":
            query = base_query.order_by(Configs.id)
        elif field == "id" and direction == "desc":
            query = base_query.order_by(Configs.id.desc())
        else:
            query = base_query
    else:
        base_query = base_query.filter(Configs.service == sort)
        
        # Проверим, есть ли конфигурации с таким service
        service_configs = db.query(Configs).filter(Configs.owner == user_id, Configs.service == sort).count()
        
        if field == "name" and direction == "asc":
            query = base_query.order_by(Configs.name)
        elif field == "name" and direction == "desc":
            query = base_query.order_by(Configs.name.desc())
        elif field == "id" and direction == "asc":
            query = base_query.order_by(Configs.id)
        elif field == "id" and direction == "desc":
            query = base_query.order_by(Configs.id.desc())
        else:
            query = base_query

    # Применяем пагинацию
    services = query.offset(offset).limit(per_page).all()

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    
    items = []
    for config, url in services:
        items.append({
            "id": config.id,
            "name": config.name,
            "service": config.service,
            "description": config.description,
            "owner": config.owner,
            "url": url
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/all_config_for_route")
async def all_config_for_route(request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id
    configs = db.query(Configs).filter((Configs.owner == user_id) | (Configs.owner == None)).all()
    return configs

@router.get("/all_configs_configurable")
async def all_config_configurable(request: Request, db: Session = Depends(get_db)):
    user_id = request.state.user.id
    configs = db.query(Configs).filter(Configs.owner == user_id).all()
    return configs
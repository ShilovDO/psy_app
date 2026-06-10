from starlette import status
from fastapi import HTTPException, status, Request, Depends, APIRouter, UploadFile, File, Form
from app.schemas.user import ID, User, FullUser, UsersResponse
from app.db.models import Users, Routes, Stations, UsersRoutes, Results
from app.core.security import get_password_hash
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
import os
import uuid
from pathlib import Path
import shutil
import base64

router = APIRouter()

# Определяем базовую директорию для загрузок
# Проверяем несколько признаков Docker-окружения
def is_docker():
    """Проверка на запуск в Docker-контейнере"""
    # Проверка 1: файл .dockerenv
    if os.path.exists("/.dockerenv"):
        return True
    # Проверка 2: переменная окружения
    if os.environ.get('DOCKER_CONTAINER', '').lower() == 'true':
        return True
    # Проверка 3: cgroup (для Linux)
    try:
        with open('/proc/1/cgroup', 'r') as f:
            if 'docker' in f.read():
                return True
    except:
        pass
    return False

# Определяем директорию
if is_docker():
    UPLOAD_DIR = Path("/app/uploads")
else:
    UPLOAD_DIR = Path("uploads")

print(f"UPLOAD_DIR set to: {UPLOAD_DIR.absolute()}")
print(f"Is Docker: {is_docker()}")

# Создаем директорию с правильными правами
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Устанавливаем права (только в Linux/Docker)
if os.name != 'nt':
    try:
        os.chmod(UPLOAD_DIR, 0o777)
        print(f"Permissions set for {UPLOAD_DIR}")
    except Exception as e:
        print(f"Could not set permissions: {e}")

def save_upload_file(upload_file: UploadFile, old_photo: str = None) -> str:
    """
    Сохраняет загруженный файл и возвращает путь для БД.
    Всегда сохраняет в UPLOAD_DIR с уникальным именем.
    """
    # Удаляем старый файл если есть
    if old_photo:
        try:
            # Извлекаем только имя файла из старого пути
            old_filename = Path(old_photo.replace('\\', '/')).name
            old_path = UPLOAD_DIR / old_filename
            if old_path.exists():
                old_path.unlink()
                print(f"Old file deleted: {old_path}")
        except Exception as e:
            print(f"Error deleting old file: {e}")
    
    # Генерируем уникальное имя
    file_extension = os.path.splitext(upload_file.filename)[1] or '.jpg'
    safe_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    # Устанавливаем права
    if os.name != 'nt':
        try:
            os.chmod(file_path, 0o666)
        except:
            pass
    
    print(f"File saved: {file_path}")
    
    # ВСЕГДА возвращаем ОТНОСИТЕЛЬНЫЙ путь для БД
    return f"uploads/{safe_filename}"

def get_image_base64(photo_path: str) -> Optional[str]:
    """Читает файл изображения и возвращает base64"""
    if not photo_path:
        return None
    
    try:
        # Нормализуем путь
        photo_path = photo_path.replace('\\', '/')
        
        # Пробуем разные варианты пути
        possible_paths = []
        
        # Если путь относительный (начинается с uploads/)
        if photo_path.startswith('uploads/'):
            possible_paths.append(UPLOAD_DIR / Path(photo_path).name)
            possible_paths.append(Path(photo_path))
        else:
            possible_paths.append(Path(photo_path))
            possible_paths.append(UPLOAD_DIR / Path(photo_path).name)
        
        # Пробуем открыть файл
        for path in possible_paths:
            if path.exists():
                with open(path, "rb") as img_file:
                    image_bytes = img_file.read()
                    return base64.b64encode(image_bytes).decode("utf-8")
        
        print(f"Image not found. Tried: {possible_paths}")
        return None
        
    except Exception as e:
        print(f"Error reading image: {e}")
        return None


@router.post("/change_user")
async def change_user(
    id: int = Form(...),
    username: str = Form(None),
    mail: str = Form(None),
    password: str = Form(None),
    admin: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        find_user = db.query(Users).filter(Users.id == id).first()
        
        if not find_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Пользователь не найден"
            )
        
        # Правильное преобразование admin
        if admin is not None and admin.lower() != 'null':
            admin = admin.lower() in ('true', '1', 'yes')
        else:
            admin = None

        # Проверка на последнего админа
        if find_user.admin and not admin:
            find_admins = db.query(Users).filter(Users.admin == True).all()
            if len(find_admins) == 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Это последний оставшийся админ в системе, его нельзя удалить",
                )
        
        # Проверка на уникальность почты
        if mail:
            check_user = (
                db.query(Users)
                .filter(Users.mail == mail)
                .filter(Users.id != id)
                .first()
            )
            if check_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с такой почтой уже существует",
                )

        # Обработка изображения
        if image and image.filename:
            try:
                # Сохраняем файл и получаем путь для БД
                photo_path = save_upload_file(image, find_user.photo)
                find_user.photo = photo_path
            except Exception as e:
                print(f"Error saving image: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to save image: {str(e)}"
                )

        # Обновляем остальные поля
        if username:
            find_user.username = username
        if mail:
            find_user.mail = mail
        if password:
            find_user.password = get_password_hash(password)
        if admin is not None:
            find_user.admin = admin
        
        db.commit()
        db.refresh(find_user)
        
        return {
            "id": find_user.id,
            "username": find_user.username,
            "mail": find_user.mail,
            "admin": find_user.admin,
        }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Unexpected error in change_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/all_users")
async def all_users(
    field: str,
    direction: str,
    page: int = 1,
    per_page: int = 10,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * per_page
    total = db.query(Users).count()

    # Сортировка
    sort_column = getattr(Users, field, Users.id)
    if direction == "desc":
        sort_column = sort_column.desc()
    
    users = (
        db.query(Users)
        .order_by(sort_column)
        .offset(offset)
        .limit(per_page)
        .all()
    )

    total_pages = (total + per_page - 1) // per_page

    items = []
    for user in users:
        image_base64 = get_image_base64(user.photo)
        
        users_response = UsersResponse(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin,
            active=user.active,
            photo=image_base64
        )
        items.append(users_response)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.post("/delete_user")
async def delete_user(Id: ID, request: Request, db: Session = Depends(get_db)):
    try:
        user_id = request.state.user.id
        check_user = db.query(Users).filter(Users.id == Id.id).first()
        if check_user:
            if user_id != check_user.id:
                check_user.active = not check_user.active
                db.commit()
                db.refresh(check_user)
                return {
                    "id": check_user.id,
                    "active": check_user.active
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Нельзя менять самого себя"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь не существует"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/search_users_out_route", response_model=List[User])
async def search_users_out_route(
    route_id: int,
    request: Request,
    search: str = "",
    db: Session = Depends(get_db)
):
    if not search:
        return []
    
    user_id = request.state.user.id
    existing_records = db.query(UsersRoutes.user_id).filter(
        UsersRoutes.route_id == route_id,
    ).all()
    existing_user_ids = {record.user_id for record in existing_records}
    
    users = db.query(Users).filter(
        Users.id != user_id,
        Users.username.like(f"{search}%"),
        ~Users.id.in_(existing_user_ids) if existing_user_ids else True
    ).all()
    
    return [
        User(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin
        )
        for user in users
    ]


@router.get("/search_users_in_route", response_model=List[User])
async def search_users_in_route(
    route_id: int,
    search: str = "",
    db: Session = Depends(get_db)
):
    existing_records = db.query(UsersRoutes.user_id).filter(
        UsersRoutes.route_id == route_id
    ).all()
    existing_user_ids = {record.user_id for record in existing_records}
    
    query = db.query(Users).filter(Users.id.in_(existing_user_ids))
    
    if search:
        query = query.filter(Users.username.ilike(f"{search}%"))
        
    users = query.filter(Users.active == True).all()
    
    return [
        User(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin
        )
        for user in users
    ]


@router.post("/add_image")
async def add_image(
    image: UploadFile = File(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    try:
        user_id = request.state.user.id
        find_user = db.query(Users).filter(Users.id == user_id).first()
        
        if not find_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Пользователь не найден"
            )

        # Используем общую функцию сохранения
        photo_path = save_upload_file(image, find_user.photo)
        find_user.photo = photo_path
        
        db.commit()
        db.refresh(find_user)

        return {
            "id": find_user.id,
            "username": find_user.username,
            "mail": find_user.mail,
            "admin": find_user.admin,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in add_image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/users_for_results")
async def users_for_results(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = request.state.user.id
    
    query = (
        db.query(Users)
        .join(Results, Results.user == Users.id)
        .join(Routes, Routes.id == Results.route)
        .filter(Routes.owner == user_id)
        .distinct()
    )

    users = query.all()

    items = []
    for user in users:
        image_base64 = get_image_base64(user.photo)
        
        users_response = UsersResponse(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin,
            active=user.active,
            photo=image_base64
        )
        items.append(users_response)

    return items
from starlette import status
from fastapi import HTTPException, status, Request, Depends, APIRouter, UploadFile, File, Form
from app.schemas.user import ID, User, FullUser, UsersResponse
from app.db.models import Users, Routes, Stations, UsersRoutes, Results
from app.core.security import get_password_hash
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
import os
import uuid
from pathlib import Path 
import shutil
import base64
from typing import Optional

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)  # создаем папку, если её нет

@router.post("/change_user/")
async def change_user(
    id: int = Form(None),
    username: str = Form(None),
    mail: str = Form(None),
    password: str = Form(None),
    admin: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)):

    find_user = db.query(Users).filter(Users.id == id).first()
    # Правильное преобразование с учетом null
    if admin is not None and admin.lower() != 'null':
        admin = admin.lower() in ('true', '1', 'yes')
    else:
        admin = None  # Явно устанавливаем None для null

    if find_user.admin and not admin:
        find_admins = db.query(Users).filter(Users.admin == True).all()
        if len(find_admins) == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это последний оставшийся админ в системе, его нельзя удалить",
            )
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

    if find_user:

        if find_user.photo:
            # Удаляем старый файл фото
            old_photo_path = Path(find_user.photo)
            if old_photo_path.exists():
                try:
                    old_photo_path.unlink()  # Удаляем файл
                except Exception as e:
                    # Логируем ошибку, но продолжаем выполнение
                    print(f"Ошибка при удалении старого файла: {e}")

        photo_path = None  # Сохраняем старый путь по умолчанию
        if image and mail:
            # Сохраняем файл на диск
            # Генерируем уникальное имя файла
            file_extension = os.path.splitext(image.filename)[1]  # Используем расширение загружаемого файла
            safe_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / safe_filename
            
            # Убеждаемся, что директория существует
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            # Сохраняем файл
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            photo_path = str(file_path)

        find_user.username = username
        find_user.mail = mail
        find_user.photo = photo_path
        if password:
            find_user.password = get_password_hash(password)
        find_user.admin = admin
        db.commit()
        db.refresh(find_user)
        return {
            "id": find_user.id,
            "username": find_user.username,
            "mail": find_user.mail,
            "admin": find_user.admin,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден"
        )


@router.get("/all_users")
async def all_users(
    field, direction, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)
):
    # Вычисляем смещение
    offset = (page - 1) * per_page

    # Получаем общее количество пользователей
    total = db.query(Users).count()

    # Получаем пагинированный список пользователей
    if field == "name" and direction == "asc":
        users = (
            db.query(Users)
            .order_by(Users.username)
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "name" and direction == "desc":
        users = (
            db.query(Users)
            .order_by(Users.username.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "email" and direction == "asc":
        users = (
            db.query(Users).order_by(Users.mail).offset(offset).limit(per_page).all()
        )
    elif field == "email" and direction == "desc":
        users = (
            db.query(Users)
            .order_by(Users.mail.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    elif field == "id" and direction == "asc":
        users = db.query(Users).order_by(Users.id).offset(offset).limit(per_page).all()
    elif field == "id" and direction == "desc":
        users = (
            db.query(Users)
            .order_by(Users.id.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
    else:
        users = db.query(Users).offset(offset).limit(per_page).all()

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page

    items = []
    for user in users:
        # Формируем base64 для изображения, если оно есть
        image_base64 = None
        if user.photo:
            try:
                with open(user.photo, "rb") as img_file:
                    image_bytes = img_file.read()
                    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
            except Exception as e:
                print(f"Error reading image: {e}")

        # Создаем объект ответа
        users_response = UsersResponse(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin,
            active=user.active,
            photo=image_base64
        )
        items.append(users_response)

    # Преобразуем каждую запись в Pydantic модель
    users_list = [User(**user.__dict__) for user in users]

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
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя менять самого себя"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Пользователь не существует"
            )
    except Exception as e:
        print(f"Refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.detail
        )

@router.get("/search_users_out_route", response_model=List[User])
async def search_users(route_id: int, request: Request, search: str = "", db: Session = Depends(get_db)):
    if not search:
        return []
    
    user_id = request.state.user.id
    # Получаем user_id всех записей для данного маршрута
    existing_records = db.query(UsersRoutes.user_id).filter(
        UsersRoutes.route_id == route_id,
    ).all()
    existing_user_ids = {record.user_id for record in existing_records}
    
    # Ищем пользователей, которых нет в маршруте
    users = db.query(Users).filter(
        Users.id != user_id,
        Users.username.like(f"{search}%"),
        ~Users.id.in_(existing_user_ids) if existing_user_ids else True
    ).all()
    
    # Формируем результат (теперь in_route всегда будет False)
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
async def search_users(route_id: int, search: str = "", db: Session = Depends(get_db)):
    # Получаем user_id всех записей для данного маршрута
    existing_records = db.query(UsersRoutes.user_id).filter(
        UsersRoutes.route_id == route_id
    ).all()
    existing_user_ids = {record.user_id for record in existing_records}
    
    # Базовый запрос — только пользователи из маршрута
    query = db.query(Users).filter(Users.id.in_(existing_user_ids))
    
    # Если есть поисковый запрос — добавляем регистронезависимый фильтр
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
async def addProduct(
    image: UploadFile = File(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    try:
        user_id = request.state.user.id
        find_user = db.query(Users).filter(Users.id == user_id).first()
        if find_user:
            # Проверяем и удаляем старое фото, если оно существует
            if find_user.photo:
                old_photo_path = Path(find_user.photo)
                if old_photo_path.exists():
                    try:
                        old_photo_path.unlink()
                        print(f"Старое фото удалено: {old_photo_path}")
                    except Exception as e:
                        print(f"Ошибка при удалении старого файла: {e}")
                        # Продолжаем выполнение, даже если не удалось удалить старый файл

            # 1. Сохраняем файл на диск
            # Генерируем уникальное имя файла (используем расширение из загружаемого файла)
            file_extension = os.path.splitext(image.filename)[1]
            safe_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Убеждаемся, что директория существует
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            file_path = UPLOAD_DIR / safe_filename
            
            # Сохраняем файл
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            # 2. Формируем объект для БД
            find_user.photo = str(file_path)

            # 3. Сохраняем в БД
            db.commit()
            db.refresh(find_user)

            # 4. Возвращаем ответ (без изображения)
            return {
                "id": find_user.id,
                "username": find_user.username,
                "mail": find_user.mail,
                "admin": find_user.admin,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден"
            )
    except HTTPException:
        raise  # Пробрасываем HTTPException дальше
    except Exception as e:
        db.rollback()
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()

@router.get("/users_for_results")
async def usersForResults(
    request: Request,
    db: Session = Depends(get_db)):
    user_id = request.state.user.id
    # Базовый запрос
    query = (
        db.query(Users)
        .join(Results, Results.user == Users.id)
        .join(Routes, Routes.id == Results.route)
        .filter(Routes.owner == user_id)
        .distinct()  # чтобы избежать дубликатов, если у пользователя несколько результатов
    )

    users = query.all()

    items = []
    for user in users:
        # Формируем base64 для изображения, если оно есть
        image_base64 = None
        if user.photo:
            try:
                with open(user.photo, "rb") as img_file:
                    image_bytes = img_file.read()
                    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
            except Exception as e:
                print(f"Error reading image: {e}")

        # Создаем объект ответа
        users_response = UsersResponse(
            id=user.id,
            username=user.username,
            mail=user.mail,
            admin=user.admin,
            photo=image_base64
        )
        items.append(users_response)

    return items
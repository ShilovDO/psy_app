from starlette import status
from fastapi import HTTPException, status, Request, Depends, APIRouter
from app.schemas.user import ID, User, FullUser
from app.db.models import Users, Routes, Stations
from app.core.security import get_password_hash
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/change_user")
async def change_user(user: FullUser, db: Session = Depends(get_db)):
    find_user = db.query(Users).filter(Users.id == user.id).first()
    if find_user.admin and not user.admin:
        find_admins = db.query(Users).filter(Users.admin == True).all()
        if len(find_admins) == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это последний оставшийся админ в системе, его нельзя удалить"
            )      
    check_user = db.query(Users).filter(Users.mail == user.mail).filter(Users.id != user.id).first()
    if check_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с такой почтой уже существует"
        )
    if find_user:
        find_user.username = user.username
        find_user.mail = user.mail
        if(user.password):
            find_user.password = get_password_hash(user.password)
        find_user.admin = user.admin
        db.commit()
        db.refresh(find_user)
        return {
            "id": find_user.id,
            "username": find_user.username,
            "mail": find_user.mail,
            "admin": find_user.admin
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User doesn't exists"
        )

@router.get("/all_users")
async def all_users(field, direction, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)):
    # Вычисляем смещение
    offset = (page - 1) * per_page
    
    # Получаем общее количество пользователей
    total = db.query(Users).count()

    # Получаем пагинированный список пользователей
    if (field == "name" and direction == "asc"):
        users = db.query(Users).order_by(Users.username).offset(offset).limit(
            per_page).all()
    elif (field == "name" and direction == "desc"):
        users = db.query(Users).order_by(Users.username.desc()).offset(offset).limit(
            per_page).all()
    elif (field == "email" and direction == "asc"):
        users = db.query(Users).order_by(Users.mail).offset(offset).limit(
            per_page).all()
    elif (field == "email" and direction == "desc"):
        users = db.query(Users).order_by(Users.mail.desc()).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "asc"):
        users = db.query(Users).order_by(Users.id).offset(offset).limit(
            per_page).all()
    elif (field == "id" and direction == "desc"):
        users = db.query(Users).order_by(Users.id.desc()).offset(offset).limit(
            per_page).all()
    else:
        users = db.query(Users).offset(offset).limit(per_page).all()

    # Вычисляем общее количество страниц
    total_pages = (total + per_page - 1) // per_page
    
    # Преобразуем каждую запись в Pydantic модель
    users_list = [User(**user.__dict__) for user in users]
    
    return {
        "items": users_list,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.post("/delete_user")
async def delete_user(Id: ID, request: Request, db: Session = Depends(get_db)):
    #try:
        user_id = request.state.user.id
        check_user = db.query(Users).filter(Users.id == Id.id).first()

        if check_user and user_id != check_user.id:         
            check_route = db.query(Routes).filter(Routes.owner == Id.id).first()

            while check_route:
                check_stations = db.query(Stations).filter(Stations.route == check_route.id).first()

                while check_stations:
                    db.query(Stations).filter(Stations.route == check_route.id).delete()
                    db.commit()
                    check_stations = db.query(Stations).filter(Stations.route == check_route.id).first()

                route = db.query(Routes).filter(Routes.id == check_route.id).delete()
                db.commit()
                check_route = db.query(Routes).filter(Routes.owner == Id.id).first()

            user = db.query(Users).filter(Users.id == Id.id).delete()
            db.commit()
            return check_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь не существует"
            )
    # except:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Вы не можете это удалить"
    #     )
from passlib.context import CryptContext
from starlette import status
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic_models import ID, TokenData, UserLogin, UserRegistration, User, FullUser
from models import Users
from database import SessionLocal
from fastapi import Response  # Импортируем Response
from fastapi.responses import JSONResponse
import time

# Конфигурация JWT
SECRET_KEY = "your-secret-key-here"  # Замените на реальный секретный ключ
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_MINUTES = 60*24*30
REFRESH_TOKEN_EXPIRE_MINUTES_LITE = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    payload = jwt.decode(encoded_jwt, SECRET_KEY, algorithms=[ALGORITHM])
    return encoded_jwt

def create_refresh_token(data: dict, remember: bool):
    to_encode = data.copy()   
    if remember: 
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES_LITE)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def refresh_tokens(data: str, db):
    credentials_exception = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": "Could not validate credentials"},
        headers={"WWW-Authenticate": "Bearer"}
    )
    payload = jwt.decode(data, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    remember = payload.get("remember")
    if user_id is None:
        return credentials_exception
    try:
        user_id = int(user_id)
        user = db.query(Users).filter(Users.id == user_id).first()
        db.close()
        if user is None:
            return credentials_exception
        return user, remember
    except ValueError:
        return credentials_exception

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": "Could not validate credentials"},
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return credentials_exception
            
        # Преобразуем строку в int (так как JWT всегда возвращает строки)
        try:
            user_id = int(user_id)
        except ValueError:
            return credentials_exception
            
    except JWTError as e:
        return credentials_exception
    
    db = SessionLocal()
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if user is None:
            return credentials_exception
        return user
    finally:
        db.close()

async def authenticate_user(userLogin: UserLogin, db):
    try:
        user = db.query(Users).filter(Users.mail == userLogin.mail).first()
        print(user)
    except:
        time.sleep(0.5)
        pass
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверная поста или пароль"
        )
    if not verify_password(userLogin.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный пароль"
        )
    return user

async def registration_user(userRegistration: UserRegistration, db):
    new_user = Users(
        username=userRegistration.username,
        mail=userRegistration.mail,
        password=get_password_hash(userRegistration.password),
        admin=userRegistration.admin
    )
    user_check = db.query(Users).filter(Users.mail == userRegistration.mail).first()
    if user_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с такой почтой уже существует"
        )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

async def change_user(user: FullUser, db):
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

async def all_users(db, field, direction, page: int = 1, per_page: int = 10):
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

async def delete_user(Id: ID, request: Request, db):
    try:
        user_id = request.state.user.id
        check_user = db.query(Users).filter(Users.id == Id.id).first()
        if check_user and user_id != check_user.id:
            user = db.query(Users).filter(Users.id == Id.id).delete()
            return check_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь не существует"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не можете это удалить"
        )

async def check_mail(db, mail: str):
    find_mail = db.query(Users).filter(Users.mail == mail).first()
    if (find_mail): return False
    return True
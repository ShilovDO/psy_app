from starlette import status
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, UploadFile, File, Form
from app.schemas.user import UserRegistration
from app.schemas.auth import UserLogin, Token
from app.db.models import Users
import time
from app.core.security import verify_password, get_password_hash
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    refresh_tokens,
)
from fastapi.responses import JSONResponse
import os
import uuid
from pathlib import Path 
import shutil
from typing import Optional

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)  # создаем папку, если её нет

@router.post("/auth", response_model=Token)
async def authenticate_user(
    userLogin: UserLogin, response: Response, db: Session = Depends(get_db)
):
    try:
        user = db.query(Users).filter(Users.mail == userLogin.mail).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверная почта или пароль",
            )
        if user.active == False:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Пользователь заблокирован",
            )
        if not verify_password(userLogin.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный пароль"
            )
        access_token = create_access_token(data={"sub": str(user.id)})
        data_refersh = {"sub": str(user.id), "remember": str(userLogin.remember)}
        refresh_token = create_refresh_token(data_refersh, userLogin.remember)
        print(refresh_token)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Для HTTP! В production поменять на True
            samesite="lax",
            domain="176.108.249.27",  # Явно указываем домен
            path="/",
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Refresh error: {e}")
        # Проверяем, является ли исключение HTTPException
        if hasattr(e, 'status_code') and hasattr(e, 'detail'):
            raise HTTPException(
                status_code=e.status_code,
                detail=e.detail
            )
        else:
            # Для OperationalError и других непредвиденных ошибок
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )

@router.post("/refresh", response_model=Token)
async def refreshTokens(
    response: Response, request: Request, db: Session = Depends(get_db)
):
    try:
        refresh_token = request.cookies.get("refresh_token")
        print(f"Refresh token from cookie: {refresh_token}")  # для отладки

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token not found",
            )

        user, remember = refresh_tokens(refresh_token, db)

        if not user:
            response.delete_cookie(key="refresh_token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный токен"
            )

        check_user = db.query(Users).filter(Users.id == user.id).first()
        if not check_user or check_user.active == False:
            response.delete_cookie(key="refresh_token")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED, detail="Пользователя не существует или он неактивен"
            )

        access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id), "remember": str(remember)}, remember=remember
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            domain="176.108.249.27",
            path="/",
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный токен"
        )

@router.post("/registration", response_model=Token)
async def registration_user(
    username: str = Form(None),
    mail: str = Form(None),
    password: str = Form(None),
    admin: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    user_check = db.query(Users).filter(Users.mail == mail).first()

    if admin is not None and admin.lower() != 'null':
        admin = admin.lower() in ('true', '1', 'yes')
    else:
        admin = None

    if user_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с такой почтой уже существует",
        )

    photo_path = None
    if image and mail:
        # Сохраняем файл на диск
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(mail)[1]
        safe_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / safe_filename
        # Сохраняем файл
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        photo_path = str(file_path)

    new_user = Users(
        username=username,
        mail=mail,
        password=get_password_hash(password),
        admin=admin,
        photo=photo_path,
        active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.mail})
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "Successfully registration",
            "new_user": new_user.id #,
            #"token_type": "bearer",
        },
    )


@router.get("/check_mail/{mail}")
async def check_mail(mail: str, db: Session = Depends(get_db)):
    find_mail = db.query(Users).filter(Users.mail == mail).first()
    if find_mail:
        return False
    return True


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    # Удаляем refresh_token из куков
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Successfully logged out"},
        headers={"WWW-Authenticate": "Bearer"},
    )
    response.delete_cookie(key="refresh_token")
    return response

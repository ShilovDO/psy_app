from starlette import status
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas.user import UserRegistration
from app.schemas.auth import UserLogin, Token
from app.db.models import Users
import time
from app.core.security import verify_password, get_password_hash
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, create_refresh_token, refresh_tokens
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/auth", response_model=Token)
async def authenticate_user(userLogin: UserLogin, response: Response, db: Session = Depends(get_db)):
    try:
        user = db.query(Users).filter(Users.mail == userLogin.mail).first()
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
        access_token = create_access_token(
            data={"sub": str(user.id)}
        )
        data_refersh={"sub": str(user.id),
            "remember": str(userLogin.remember)}
        refresh_token = create_refresh_token(data_refersh, userLogin.remember)
        print(refresh_token)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Для HTTP! В production поменять на True
            samesite="lax",
            domain="176.108.249.27",  # Явно указываем домен
            path="/"
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except:
        time.sleep(0.5)
        pass

@router.post("/refresh", response_model=Token)
async def refreshTokens(
    response: Response, 
    request: Request, 
    db: Session = Depends(get_db)
):
    try:
        refresh_token = request.cookies.get("refresh_token")
        print(f"Refresh token from cookie: {refresh_token}")  # для отладки
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token not found"
            )
        
        user, remember = refresh_tokens(refresh_token, db)
        
        if not user:
            response.delete_cookie(key="refresh_token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Некорректный токен"
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id), "remember": str(remember)},
            remember=remember
        )
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            domain="176.108.249.27",
            path="/"
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректный токен"
        )

@router.post("/registration", response_model=Token)
async def registration_user(userRegistration: UserRegistration, db: Session = Depends(get_db)):
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
    access_token = create_access_token(
        data={"sub": new_user.mail}
    )
    return JSONResponse(
    status_code=status.HTTP_201_CREATED,
    content={
        "message": "Successfully registration",
        "access_token": access_token, 
        "token_type":"bearer"
    })

@router.get("/check_mail/{mail}")
async def check_mail(mail: str, db: Session = Depends(get_db)):
    find_mail = db.query(Users).filter(Users.mail == mail).first()
    if (find_mail): return False
    return True

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    # Удаляем refresh_token из куков
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Successfully logged out"},
        headers={"WWW-Authenticate": "Bearer"}
    )
    response.delete_cookie(key="refresh_token")
    return response 
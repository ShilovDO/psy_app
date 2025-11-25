from fastapi import FastAPI, Depends, HTTPException, status, Request, Cookie
from database import SessionLocal
from models import Users
from security import (
    get_password_hash,
    authenticate_user,
    registration_user,
    create_access_token,
    create_refresh_token,
    get_current_user,
    all_users,
    oauth2_scheme,
    change_user,
    refresh_tokens,
    delete_user,
    check_mail
)
from services import (
    create_service,
    change_service,
    all_service,
    available_service,
    delete_service
)
from routes import (
    create_route,
    add_station,
    delete_route,
    all_route,
    all_station, change_station, get_route
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Annotated
from pydantic import BaseModel
from pydantic_models import UserLogin, TokenData, Token, UserRegistration, NewService, Service, ID, NewRoute, NewStation, Route, FullUser, User
from fastapi import APIRouter, Depends
from fastapi import Response
from middleware.middleware import auth_middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "message": "Validation error",
            "details": exc.errors()
        },
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.detail
        },
        headers=exc.headers if hasattr(exc, 'headers') else None,
    )

@app.exception_handler(Exception)
async def universal_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error"
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation error"},
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
        headers=exc.headers if hasattr(exc, 'headers') else None
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"},
    )

# Разрешаем запросы с указанных доменов (в вашем случае — фронтенд на `localhost:5177`)
# Разрешаем запросы с указанных доменов (в вашем случае — фронтенд на `localhost:5177`)
origins = [
    #"*"
    "http://localhost:5177",  # Ваш Vite/React фронтенд
    "http://127.0.0.1:5177",  
]

app.middleware("http")(auth_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"]
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Forwarded-Proto"] = "http"  # Или "https" в production
    response.headers["Access-Control-Expose-Headers"] = "Authorization, Set-Cookie"
    return response

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/test")
async def test():
    db = SessionLocal()
    new_user = Users(
        username="admin", 
        mail="admin@admin.ru", 
        password=get_password_hash('admin'), 
        admin=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()
    return {"message": "Success"}

@app.get("/get_current_user")
async def currenUser(request: Request):
    try:
        if request.method == "OPTIONS":
            return Response(status_code=200)
        user_dict = {
            "id": request.state.user.id,
            "username": request.state.user.username,
            "email": request.state.user.mail,
            "admin": request.state.user.admin
        }
        return JSONResponse(
            content={"user": user_dict},
        )
    except:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully logged out"}
        )

@app.post("/auth", response_model=Token)
async def login_for_access_token(userLogin: UserLogin, response: Response):
    db = SessionLocal()
    #print(userLogin)
    #print(userLogin.mail)
    #print(userLogin.password)
    user = await authenticate_user(
        userLogin,
        db
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
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
    db.close()
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/check_mail/{mail}")
async def checkMail(mail: str):
    db = SessionLocal()
    isFree = await check_mail(db, mail)
    db.close()
    return isFree


@app.post("/registration", response_model=Token)
async def registration(userRegistration: UserRegistration):
    db = SessionLocal()
    user = await registration_user(userRegistration, db)
    access_token = create_access_token(
        data={"sub": user.mail}
    )
    db.close()
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "Successfully registration",
            "access_token": access_token, 
            "token_type":"bearer"
        })

@app.post("/refresh", response_model=Token)
async def refreshTokens(response: Response, request: Request):
    try:
        db = SessionLocal()
        refresh_token = request.cookies.get("refresh_token")
        print(refresh_token)
        user, remember = refresh_tokens(refresh_token, db)
        print(user.id)
        if not user:
            response.delete_cookie(key="refresh_token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message":"Некорректный токен"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(
            data={"sub": str(user.id)}
        )
        data_refersh={"sub": str(user.id),
            "remember": str(remember)}
        refresh_token = create_refresh_token(data_refersh, remember)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message":"Некорректный токен"},
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    # Удаляем refresh_token из куков
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Successfully logged out"},
        headers={"WWW-Authenticate": "Bearer"}
    )
    response.delete_cookie(key="refresh_token")
    return response     


@app.get("/users/me/", response_model=UserRegistration)
async def read_users_me(current_user: UserRegistration = Depends(get_current_user)):
    return current_user

@app.get("/all_users")
async def allUsers(field: str, direction: str, page: int = 1, per_page: int = 10):
    db = SessionLocal()
    result = await all_users(db, field, direction, page, per_page)
    db.close()
    return result

@app.post("/change_user")
async def changeUsers(user: FullUser):
    print("Received data:", user.dict())
    db = SessionLocal()
    new_user = await change_user(user, db)
    db.commit()
    db.close()
    return new_user

@app.post("/delete_user")
async def addService(user_id: ID, request: Request):
    db = SessionLocal()
    user = await delete_user(user_id, request, db)
    db.commit()
    db.close()
    return user

@app.post("/add_service")
async def addService(new_service: NewService):
    db = SessionLocal()
    service = await create_service(new_service, db)
    db.add(service)
    db.commit()
    db.refresh(service)
    db.close()
    return service

@app.post("/change_service")
async def changeService(service: Service):
    db = SessionLocal()
    service = await change_service(service, db)
    db.commit()
    db.refresh(service)
    db.close()
    return service

@app.post("/delete_service")
async def addService(service: Service):
    db = SessionLocal()
    service = await delete_service(service, db)
    db.commit()
    db.close()
    return service

@app.get("/all_service")
async def allService(field: str, direction: str, page: int = 1, per_page: int = 10):
    db = SessionLocal()
    result = await all_service(db, field, direction, page, per_page)
    db.close()
    return result

@app.get("/available_service")
async def allService(field, direction, page: int = 1, per_page: int = 10):
    db = SessionLocal()
    result = await available_service(db, field, direction, page, per_page)
    db.close()
    return result

@app.post("/add_route")
async def addRoute(new_route: NewRoute, request: Request):
    db = SessionLocal()
    route = await create_route(new_route, request, db)
    db.add(route)
    db.commit()
    db.refresh(route)
    db.close()
    return route

@app.post("/add_station")
async def addStation(station: NewStation):
    db = SessionLocal()
    route = await add_station(station, db)
    db.add(route)
    db.commit()
    db.refresh(route)
    db.close()
    return route

@app.post("/change_station")
async def changeStation(station: NewStation):
    db = SessionLocal()
    station = await change_station(station, db)
    db.commit()
    db.refresh(station)
    db.close()
    return station

@app.post("/delete_route")
async def deleteRoute(route: Route):
    db = SessionLocal()
    route = await delete_route(route, db)
    db.commit()
    db.close()
    return route

@app.get("/all_route")
async def allRoute(request: Request, field: str, direction: str, page: int = 1, per_page: int = 10, ):
    db = SessionLocal()
    result = await all_route(request, field, direction, db, page, per_page)
    db.close()
    return result

@app.get("/get_route/{route_id}")
async def getRoute(route_id: int):
    db = SessionLocal()
    result = await get_route(db, route_id)
    db.close()
    return result

@app.get("/all_station/{route_id}")
async def allStation(route_id: int):
    db = SessionLocal()
    services = await all_station(route_id, db)
    db.close()
    return services
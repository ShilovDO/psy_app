from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import status
from fastapi.responses import JSONResponse
from jose import jwt
from starlette import status
from datetime import datetime, timedelta
from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
    REFRESH_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_MINUTES_LITE,
)
from app.db.models import Users

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
        expire = datetime.utcnow() + timedelta(
            minutes=REFRESH_TOKEN_EXPIRE_MINUTES_LITE
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def refresh_tokens(data: str, db):
    credentials_exception = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": "Could not validate credentials"},
        headers={"WWW-Authenticate": "Bearer"},
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

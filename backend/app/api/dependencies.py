from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.db.session import SessionLocal
from app.db.models import Users
from app.core.config import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except JWTError:
        raise credentials_exception

    # Создаем сессию с обработкой ошибок подключения
    db = SessionLocal()
    try:
        try:
            user = db.query(Users).filter(Users.id == user_id).first()
        except (OperationalError, DisconnectionError) as e:
            # Соединение протухло - закрываем старую сессию и создаем новую
            print(f"Соединение с БД потеряно, переподключаемся: {e}")
            db.close()
            db = SessionLocal()
            # Пробуем еще раз с новой сессией
            user = db.query(Users).filter(Users.id == user_id).first()

        if user is None:
            raise credentials_exception

        return user
    finally:
        db.close()
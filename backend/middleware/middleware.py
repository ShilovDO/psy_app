from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from jose import JWTError
from fastapi.security.utils import get_authorization_scheme_param
from security import get_current_user

async def auth_middleware(request: Request, call_next):
    # Разрешаем OPTIONS запросы без проверки авторизации
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Эндпоинты, не требующие аутентификации
    public_endpoints = ["/", "/hello", "/auth", "/test", "/refresh", "/registration"]
    
    if request.url.path in public_endpoints:
        return await call_next(request)

    try:
        authorization = request.headers.get("authorization")
        
        # Специальная обработка для /get_current_user
        if request.url.path == "/get_current_user" and not authorization:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"user": None},
            )

        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Нет заголовка авторизации",
                headers={"WWW-Authenticate": "Bearer"},
            )

        scheme, token = get_authorization_scheme_param(authorization)
        if not token or scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Не удалось получить токен из заголовка",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Получаем пользователя
        user = await get_current_user(token)
        if isinstance(user, JSONResponse):
            return user

        # Проверка прав администратора
        admin_endpoints = [
            "/add_service", "/change_service", "/delete_service",
            "/all_users", "/change_user", "/delete_user", "/all_service"
        ]
        if request.url.path in admin_endpoints and not user.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав администратора",
            )

        request.state.user = user
        response = await call_next(request)
        return response

    except HTTPException as http_exc:
        return JSONResponse(
            status_code=http_exc.status_code,
            content={"message": http_exc.detail},
            headers=http_exc.headers if hasattr(http_exc, 'headers') else None,
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Internal server error"},
        )
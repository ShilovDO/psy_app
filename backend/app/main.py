from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.middleware import auth_middleware
from app.api.endpoints import auth, users, services, configs, routes, stations, results
from fastapi.responses import JSONResponse

app = FastAPI()

# CORS
origins = ["http://localhost:5177", "http://127.0.0.1:5177"]

# Кастомная middleware
app.middleware("http")(auth_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(services.router, prefix="/services", tags=["Services"])
app.include_router(configs.router, prefix="/configs", tags=["Configs"])
app.include_router(routes.router, prefix="/routes", tags=["Routes"])
app.include_router(stations.router, prefix="/stations", tags=["Stations"])
app.include_router(results.router, prefix="/results", tags=["Results"])


@app.get("/get_current_user")
async def currenUser(request: Request):
    try:
        if request.method == "OPTIONS":
            return Response(status_code=200)
        user_dict = {
            "id": request.state.user.id,
            "username": request.state.user.username,
            "email": request.state.user.mail,
            "admin": request.state.user.admin,
        }
        return JSONResponse(
            content={"user": user_dict},
        )
    except:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully logged out"},
        )

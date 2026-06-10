from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.middleware import auth_middleware
from app.api.endpoints import auth, users, services, configs, routes, stations, results
from fastapi.responses import JSONResponse
import base64

app = FastAPI()

# CORS
origins = ["http://localhost:5177", "http://127.0.0.1:5177", "http://192.168.255.129:5177"]

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


        image_base64 = None
        if request.state.user.photo:
            with open(request.state.user.photo, "rb") as img_file:
                image_bytes = img_file.read()
                image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        user_dict = {
            "id": request.state.user.id,
            "username": request.state.user.username,
            "email": request.state.user.mail,
            "photo": image_base64,
            "admin": request.state.user.admin
        }
        return {
            "user": user_dict
        }
    except:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successfully logged out"},
        )

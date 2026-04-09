# Конфигурация JWT
SECRET_KEY = "your-secret-key-here"  # Замените на реальный секретный ключ
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180  # todo было 15
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30
REFRESH_TOKEN_EXPIRE_MINUTES_LITE = 180  # todo было 60

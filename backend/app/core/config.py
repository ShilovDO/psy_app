# Конфигурация JWT
SECRET_KEY = "your-secret-key-here"  # Замените на реальный секретный ключ
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1000000000  # todo было 15
REFRESH_TOKEN_EXPIRE_MINUTES = 1000000000 #60 * 24 * 30
REFRESH_TOKEN_EXPIRE_MINUTES_LITE = 1000000000 #180  # todo было 60

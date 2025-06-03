from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:PasswordDBWEB2025&@176.108.249.27:5432/psycho"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Changed from .models to absolute import
from models import Base

Base.metadata.create_all(bind=engine)
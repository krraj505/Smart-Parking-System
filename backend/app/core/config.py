import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Parking Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smartparking_super_secret_jwt_key_2026_dev_mode_token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default, or PostgreSQL if configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_parking.db")
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

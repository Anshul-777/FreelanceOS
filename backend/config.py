from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "FreelanceOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./freelanceos.db"

    # JWT
    SECRET_KEY: str = "freelanceos-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Demo user
    DEMO_EMAIL: str = "demo@freelanceos.com"
    DEMO_PASSWORD: str = "demo123"
    DEMO_NAME: str = "Alex Johnson"
    DEMO_COMPANY: str = "Alex Johnson Design & Dev"
    DEMO_HOURLY_RATE: float = 95.0
    DEMO_CURRENCY: str = "USD"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

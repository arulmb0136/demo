import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Ironclad Contract Hub API"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://localhost:80,http://127.0.0.1:5173"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "colored"

    # Security & JWT
    SECRET_KEY: str = "ironclad_super_secret_jwt_key_change_in_production_2026_xyz!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # PostgreSQL Database (ONLY for Users, Roles & Permissions)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ironclad_db"

    # Ironclad Live API Credentials (developer.ironcladapp.com)
    # Server URLs: https://ironcladapp.com/public/api/v1 (or demo.ironcladapp.com, eu1.ironcladapp.com)
    IRONCLAD_API_BASE_URL: str = "https://ironcladapp.com/public/api/v1"
    IRONCLAD_TOKEN_URL: str = "https://ironcladapp.com/oauth/token"
    IRONCLAD_CLIENT_ID: str = ""
    IRONCLAD_CLIENT_SECRET: str = ""
    IRONCLAD_AS_USER_EMAIL: str = ""
    VERIFY_SSL: bool = True

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Support environment variable aliases
if not settings.IRONCLAD_CLIENT_ID and os.getenv("CLIENT_ID"):
    settings.IRONCLAD_CLIENT_ID = os.environ["CLIENT_ID"].strip()
if not settings.IRONCLAD_CLIENT_SECRET and os.getenv("CLIENT_SECRET"):
    settings.IRONCLAD_CLIENT_SECRET = os.environ["CLIENT_SECRET"].strip()
if not settings.IRONCLAD_AS_USER_EMAIL and os.getenv("X_AS_USER_EMAIL"):
    settings.IRONCLAD_AS_USER_EMAIL = os.environ["X_AS_USER_EMAIL"].strip()

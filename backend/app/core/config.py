import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Ironclad Contract Hub API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
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
    LOG_FORMAT: str = "colored"  # "colored" or "json"

    # Security & JWT
    SECRET_KEY: str = "ironclad_super_secret_jwt_key_change_in_production_2026_xyz!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ironclad_db"

    # Data Source Toggle: 'postgres' or 'ironclad'
    DATA_SOURCE: str = "postgres"

    # Ironclad API Configuration
    IRONCLAD_API_BASE_URL: str = "https://ironcladapp.com/api/v1"
    IRONCLAD_CLIENT_ID: str = "ironclad_demo_client_id"
    IRONCLAD_CLIENT_SECRET: str = "ironclad_demo_client_secret"
    IRONCLAD_BEARER_TOKEN: str = "demo_ironclad_bearer_token"
    IRONCLAD_DEMO_MODE: bool = True

    # S3 / MinIO Configuration
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "ironclad-documents"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False
    S3_MOCK_FALLBACK: bool = True

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

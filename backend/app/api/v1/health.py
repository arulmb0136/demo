from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "data_source": settings.DATA_SOURCE,
        "version": "1.0.0"
    }

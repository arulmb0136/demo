from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "data_source": "live_ironclad_api",
        "ironclad_base_url": settings.IRONCLAD_API_BASE_URL,
        "version": "2.0.0"
    }

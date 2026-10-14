import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.middleware.logging_middleware import CorrelationIdAndLoggingMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.contracts import router as contracts_router
from app.api.v1.roles import router as roles_router
from app.api.v1.users import router as users_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Ironclad Live Contract Hub & RBAC Management Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Register Centralized Logging & Correlation ID Middleware
app.add_middleware(CorrelationIdAndLoggingMiddleware)

# 2. Register CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Response-Time-Ms"]
)

# 3. Mount API v1 Routers
API_V1_PREFIX = "/api/v1"
app.include_router(health_router, prefix=API_V1_PREFIX)
app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(contracts_router, prefix=API_V1_PREFIX)
app.include_router(roles_router, prefix=API_V1_PREFIX)
app.include_router(users_router, prefix=API_V1_PREFIX)

# 4. Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error. Please contact systems administrator.",
            "error_detail": str(exc) if settings.DEBUG else None
        }
    )

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' mode")
    logger.info("Contract data source: Live Ironclad API (Zero Database Contract Persistence)")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Gracefully shutting down Ironclad Application...")

@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": "/api/v1/health"
    }

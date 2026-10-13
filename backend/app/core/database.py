from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from app.core.config import settings
from app.core.logging import logger

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        connect_args=connect_args,
        echo=False
    )
except Exception as e:
    logger.error(f"Error creating database engine for {settings.DATABASE_URL}: {e}")
    # Fallback to local SQLite if PostgreSQL fails to connect during local dev
    fallback_url = "sqlite:///./ironclad_dev.db"
    logger.warning(f"Falling back to local SQLite engine: {fallback_url}")
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for providing a transactional SQLAlchemy Session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

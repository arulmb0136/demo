from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, TokenResponse, UserResponse
from app.core.logging import logger

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def authenticate_user(self, email: str, password: str) -> User:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Failed authentication attempt for email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive"
            )
        logger.info(f"User authenticated successfully: {user.email} (Role: {user.role})")
        return user

    def create_user_token(self, user: User) -> TokenResponse:
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )

    def register_user(self, user_in: UserCreate) -> User:
        existing = self.user_repo.get_by_email(user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
            permissions=user_in.permissions
        )
        return self.user_repo.create(user)

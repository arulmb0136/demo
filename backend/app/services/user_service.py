from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserUpdate, UserResponse
from app.core.logging import logger

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def list_users(self) -> List[User]:
        return self.repo.list(skip=0, limit=200)

    def get_user(self, user_id: int) -> User:
        user = self.repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        return user

    def update_user_role_and_permissions(self, user_id: int, role: str, permissions: List[str]) -> User:
        user = self.get_user(user_id)
        logger.info(f"Updating RBAC for user {user.email}: new role='{role}', perms={permissions}")
        updated = self.repo.update_role_and_permissions(user_id, role, permissions)
        return updated

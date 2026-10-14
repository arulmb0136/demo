from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_permission, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.role import UserRoleUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["User & Role Administration"])

@router.get("/", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_permission("users:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.list_users()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_permission("users:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.create_user(user_in)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(require_permission("users:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_user(user_id, user_in)

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    current_user: User = Depends(require_permission("users:manage")),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_user_role_and_permissions(
        user_id=user_id,
        role=role_in.role,
        permissions=role_in.permissions
    )

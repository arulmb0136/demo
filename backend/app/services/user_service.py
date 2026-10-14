from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.role_permission import RoleDefinition
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.role import RoleCreate, RoleUpdate
from app.core.security import get_password_hash
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

    def create_user(self, user_in: UserCreate) -> User:
        existing = self.repo.get_by_email(user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{user_in.email}' already exists."
            )
        
        # Determine default permissions if not explicitly provided
        permissions = user_in.permissions
        if not permissions or permissions == ["read"]:
            role_def = self.db.query(RoleDefinition).filter(RoleDefinition.role_key == user_in.role).first()
            if role_def:
                permissions = role_def.default_permissions

        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
            permissions=permissions,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"Admin created new user {user.email} (role: {user.role})")
        return user

    def update_user(self, user_id: int, user_in: UserUpdate) -> User:
        user = self.get_user(user_id)
        if user_in.full_name is not None:
            user.full_name = user_in.full_name
        if user_in.role is not None:
            user.role = user_in.role
        if user_in.permissions is not None:
            user.permissions = user_in.permissions
        if user_in.is_active is not None:
            user.is_active = user_in.is_active

        self.db.commit()
        self.db.refresh(user)
        logger.info(f"Updated user ID {user_id} ({user.email})")
        return user

    def update_user_role_and_permissions(self, user_id: int, role: str, permissions: List[str]) -> User:
        user = self.get_user(user_id)
        logger.info(f"Updating RBAC for user {user.email}: new role='{role}', perms={permissions}")
        updated = self.repo.update_role_and_permissions(user_id, role, permissions)
        return updated

    # -------------------------------------------------------------
    # Role Administration Methods
    # -------------------------------------------------------------
    def list_roles(self) -> List[RoleDefinition]:
        return self.db.query(RoleDefinition).all()

    def create_role(self, role_in: RoleCreate) -> RoleDefinition:
        existing = self.db.query(RoleDefinition).filter(RoleDefinition.role_key == role_in.role_key.lower().strip()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with key '{role_in.role_key}' already exists."
            )
        role = RoleDefinition(
            role_key=role_in.role_key.lower().strip(),
            display_name=role_in.display_name,
            description=role_in.description,
            default_permissions=role_in.default_permissions
        )
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        logger.info(f"Created new role '{role.role_key}' with permissions {role.default_permissions}")
        return role

    def update_role(self, role_id: int, role_in: RoleUpdate) -> RoleDefinition:
        role = self.db.query(RoleDefinition).filter(RoleDefinition.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found."
            )
        if role_in.display_name is not None:
            role.display_name = role_in.display_name
        if role_in.description is not None:
            role.description = role_in.description
        if role_in.default_permissions is not None:
            role.default_permissions = role_in.default_permissions

        self.db.commit()
        self.db.refresh(role)
        logger.info(f"Updated role ID {role_id} ({role.role_key})")
        return role

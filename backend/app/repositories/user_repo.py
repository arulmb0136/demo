from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def update_role_and_permissions(self, user_id: int, role: str, permissions: List[str]) -> Optional[User]:
        user = self.get(user_id)
        if not user:
            return None
        user.role = role
        user.permissions = permissions
        self.db.commit()
        self.db.refresh(user)
        return user

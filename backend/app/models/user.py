from sqlalchemy import Column, Integer, String, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer", index=True) # admin, manager, editor, viewer
    permissions = Column(JSON, default=list, nullable=False) # ["read", "write", "edit", "delete", "admin"]
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"

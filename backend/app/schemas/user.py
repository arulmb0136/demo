from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "viewer"
    permissions: List[str] = ["read"]

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

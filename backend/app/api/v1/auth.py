from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserResponse, UserCreate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_req.email, login_req.password)
    return auth_service.create_user_token(user)

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password spec compliant endpoint for Swagger UI authorization"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    return auth_service.create_user_token(user)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.register_user(user_in)
    return user

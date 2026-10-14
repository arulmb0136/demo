from datetime import datetime, timedelta
from typing import Optional, List, Callable, Set
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Aliases to guarantee backward and cross-compatibility
PERMISSION_ALIASES = {
    "contracts:view": {"contracts:view", "read", "view"},
    "contracts:download": {"contracts:download", "download"},
    "users:manage": {"users:manage", "admin"},
    "roles:manage": {"roles:manage", "admin"},
    "read": {"read", "contracts:view", "view"},
    "download": {"download", "contracts:download"},
    "admin": {"admin", "users:manage", "roles:manage"}
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash"""
    try:
        password_bytes = plain_password[:72].encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        logger.error(f"Error checking password hash: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a plain password"""
    password_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """FastAPI Dependency to decode JWT and load authenticated User"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as err:
        logger.warning(f"JWT validation failed: {str(err)}")
        raise credentials_exception

    from app.models.user import User
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(allowed_roles: List[str]) -> Callable:
    """Dependency factory checking user has one of allowed roles"""
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            logger.warning(
                f"Access denied: User {current_user.email} (role: {current_user.role}) "
                f"lacks required roles: {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_permission(permission: str) -> Callable:
    """Dependency factory checking user has specific permission grant or acceptable alias"""
    def permission_checker(current_user = Depends(get_current_user)):
        # Admin role implicitly grants all permissions
        if current_user.role == "admin":
            return current_user

        user_perms = set(current_user.permissions or [])
        acceptable_keys = PERMISSION_ALIASES.get(permission, {permission})

        if not user_perms.intersection(acceptable_keys):
            logger.warning(
                f"Access denied: User {current_user.email} lacks permission '{permission}'. "
                f"User permissions: {user_perms}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You lack the '{permission}' permission for this resource."
            )
        return current_user
    return permission_checker

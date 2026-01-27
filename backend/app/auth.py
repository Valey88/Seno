"""
JWT Authentication utilities.
Updated to use bcrypt directly instead of passlib to fix Python 3.13 compatibility.
"""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt  # <-- Используем напрямую вместо passlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, settings
from app.models import User
from app.schemas import TokenData

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash using direct bcrypt.
    Handles the 72-byte limit to prevent ValueError.
    """
    # Bcrypt имеет жесткое ограничение в 72 байта.
    # Если пароль длиннее, мы обрезаем его, чтобы избежать падения сервера.
    if len(plain_password) > 72:
        plain_password = plain_password[:72]

    # Bcrypt требует байты, а не строки
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # Если хеш в базе данных некорректен
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using direct bcrypt.
    """
    # Обрезаем до 72 символов перед хешированием
    if len(password) > 72:
        password = password[:72]

    # Генерируем соль и хеш
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)

    # Возвращаем строку (декодируем байты), чтобы сохранить в БД
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """Get user by username."""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def authenticate_user(
    db: AsyncSession, username: str, password: str
) -> Optional[User]:
    """Authenticate a user."""
    user = await get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = await get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception

    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user and verify admin role."""
    # Импорт внутри функции во избежание циклического импорта, если UserRole определен в models
    from app.models import UserRole

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user

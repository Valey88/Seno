"""
Authentication router - handles login and token generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime
import secrets
import random

from app.database import get_db, settings
from app.schemas import (
    Token, UserRead, EmailVerificationRequest, 
    EmailVerificationConfirm, UserRegister
)
from app.auth import (
    authenticate_user, create_access_token, get_current_user,
    get_password_hash, get_user_by_username
)
from app.models import User, EmailVerificationCode, UserRole
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login endpoint - returns JWT token.
    
    Use form data with:
    - username: admin username
    - password: admin password
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return current_user


@router.post("/request-verification")
async def request_email_verification(
    request: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request email verification code.
    Sends a 4-digit code to the provided email.
    """
    email = request.email.lower().strip()
    
    # Check if user with this email already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )
    
    # Generate 4-digit code
    code = str(random.randint(1000, 9999))
    
    # Delete old codes for this email
    result = await db.execute(
        select(EmailVerificationCode).where(EmailVerificationCode.email == email)
    )
    old_codes = result.scalars().all()
    for old_code in old_codes:
        db.delete(old_code)
    if old_codes:
        await db.commit()
    
    # Create new verification code
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    verification_code = EmailVerificationCode(
        email=email,
        code=code,
        expires_at=expires_at,
        is_used=False
    )
    
    db.add(verification_code)
    await db.commit()
    
    # Send email (non-blocking, don't fail if email sending fails)
    try:
        await email_service.send_verification_code(email, code)
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send email: {str(e)}")
        logger.info(f"Verification code for {email}: {code}")
    
    return {
        "message": "Код подтверждения отправлен на email",
        "email": email
    }


@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with email verification.
    """
    # Check if username already exists
    existing_user = await get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким логином уже существует"
        )
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email.lower()))
    existing_email = result.scalar_one_or_none()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )
    
    # Verify code
    result = await db.execute(
        select(EmailVerificationCode).where(
            EmailVerificationCode.email == user_data.email.lower(),
            EmailVerificationCode.code == user_data.code,
            EmailVerificationCode.is_used == False
        )
    )
    verification_code = result.scalar_one_or_none()
    
    if not verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный или истекший код подтверждения"
        )
    
    if verification_code.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код подтверждения истек"
        )
    
    # Mark code as used
    verification_code.is_used = True
    
    # Create user
    password_hash = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        password_hash=password_hash,
        email=user_data.email.lower(),
        name=user_data.name,
        role=UserRole.USER,
        is_verified=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# ============ YANDEX OAUTH ============

@router.get("/yandex")
async def yandex_login():
    """
    Redirect to Yandex OAuth authorization page.
    """
    if not settings.yandex_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yandex OAuth не настроен. Добавьте YANDEX_CLIENT_ID в .env"
        )
    
    yandex_auth_url = (
        f"https://oauth.yandex.ru/authorize"
        f"?response_type=code"
        f"&client_id={settings.yandex_client_id}"
        f"&redirect_uri={settings.yandex_redirect_uri}"
    )
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=yandex_auth_url)


@router.get("/yandex/callback")
async def yandex_callback(
    code: str = None,
    error: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Yandex OAuth callback.
    Exchange code for token, get user info, create/find user, return JWT.
    """
    import httpx
    from fastapi.responses import RedirectResponse
    
    if error:
        return RedirectResponse(url=f"http://localhost:3000/?auth_error={error}")
    
    if not code:
        return RedirectResponse(url="http://localhost:3000/?auth_error=no_code")
    
    # Exchange code for access token
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                return RedirectResponse(
                    url=f"http://localhost:3000/?auth_error=token_exchange_failed"
                )
            
            token_data = token_response.json()
            yandex_access_token = token_data.get("access_token")
            
            # Get user info from Yandex
            user_response = await client.get(
                "https://login.yandex.ru/info",
                headers={"Authorization": f"OAuth {yandex_access_token}"}
            )
            
            if user_response.status_code != 200:
                return RedirectResponse(
                    url=f"http://localhost:3000/?auth_error=user_info_failed"
                )
            
            yandex_user = user_response.json()
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Yandex OAuth error: {e}")
        return RedirectResponse(url=f"http://localhost:3000/?auth_error=network_error")
    
    # Find or create user
    yandex_id = yandex_user.get("id")
    yandex_email = yandex_user.get("default_email", "")
    yandex_name = yandex_user.get("real_name") or yandex_user.get("display_name") or "Пользователь"
    
    # Try to find by yandex_id
    result = await db.execute(select(User).where(User.yandex_id == str(yandex_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        # Try to find by email
        if yandex_email:
            result = await db.execute(select(User).where(User.email == yandex_email.lower()))
            user = result.scalar_one_or_none()
            
            if user:
                # Link existing user with Yandex
                user.yandex_id = str(yandex_id)
                user.oauth_provider = "yandex"
                await db.commit()
    
    if not user:
        # Create new user
        # Generate unique username from yandex_id
        username = f"yandex_{yandex_id}"
        
        # Generate a random password hash for OAuth users
        # (They won't use password login, but DB has NOT NULL constraint)
        import secrets
        random_password = secrets.token_urlsafe(32)
        
        user = User(
            username=username,
            password_hash=get_password_hash(random_password),
            email=yandex_email.lower() if yandex_email else None,
            name=yandex_name,
            role=UserRole.USER,
            is_verified=True,
            yandex_id=str(yandex_id),
            oauth_provider="yandex"
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Redirect to frontend with token
    return RedirectResponse(
        url=f"http://localhost:3000/?access_token={access_token}"
    )

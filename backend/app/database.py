"""
Database configuration and session management.
Supports PostgreSQL for production and SQLite for local development.
"""

import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

load_dotenv()

# Base class for models
Base = declarative_base()


class Settings(BaseSettings):
    """Application settings."""

    # PostgreSQL by default for production, can override with SQLite for local dev
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/senoval"
    )
    secret_key: str = os.getenv(
        "SECRET_KEY", "change-this-secret-key-in-production-min-32-chars"
    )
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Telegram & SMTP settings
    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    telegram_chat_id: str = os.getenv("TELEGRAM_CHAT_ID", "")
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: str = os.getenv("SMTP_PORT", "587")
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    from_email: str = os.getenv("FROM_EMAIL", "")
    smtp_use_tls: str = os.getenv("SMTP_USE_TLS", "true")

    # YooKassa payment settings
    yookassa_shop_id: str = os.getenv("YOOKASSA_SHOP_ID", "")
    yookassa_secret_key: str = os.getenv("YOOKASSA_SECRET_KEY", "")
    yookassa_return_url: str = os.getenv(
        "YOOKASSA_RETURN_URL", "http://localhost:3000/booking/success"
    )
    yookassa_test_mode: str = os.getenv("YOOKASSA_TEST_MODE", "true")

    # Yandex OAuth settings
    yandex_client_id: str = os.getenv("YANDEX_CLIENT_ID", "")
    yandex_client_secret: str = os.getenv("YANDEX_CLIENT_SECRET", "")
    yandex_redirect_uri: str = os.getenv(
        "YANDEX_REDIRECT_URI", "http://localhost:8000/api/auth/yandex/callback"
    )
    
    # Frontend URL for CORS and redirects
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"


settings = Settings()

# Determine if using SQLite (for local development)
is_sqlite = settings.database_url.startswith("sqlite")

# Create async engine with appropriate settings
engine_kwargs = {
    "echo": os.getenv("DEBUG", "false").lower() == "true",
    "future": True,
}

# PostgreSQL specific settings
if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,  # Verify connections are alive
    })

engine = create_async_engine(settings.database_url, **engine_kwargs)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """
    Dependency for getting database session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Initialize database - create all tables.
    """
    # Import models so SQLAlchemy knows about them
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

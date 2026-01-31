"""
Database configuration and session management.
Fixed to ensure tables are created by importing models in init_db.
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

    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./senoval.db")
    secret_key: str = os.getenv(
        "SECRET_KEY", "change-this-secret-key-in-production-min-32-chars"
    )
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Telegram & SMTP settings (оставляем как было у вас)
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

    class Config:
        env_file = ".env"


settings = Settings()

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=True,  # Set to False in production
    future=True,
)

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
    # !!! ВАЖНО: Импортируем модели, чтобы SQLAlchemy знала о них при создании таблиц !!!
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

"""
SQLAlchemy models for the Senoval restaurant backend.
"""

import enum
from datetime import time

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Zone(str, enum.Enum):
    """Table zone enum."""

    HALL_1 = "HALL_1"
    HALL_2 = "HALL_2"
    HALL_3 = "HALL_3"


class BookingStatus(str, enum.Enum):
    """Booking status enum."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class UserRole(str, enum.Enum):
    """User role enum."""

    ADMIN = "ADMIN"
    USER = "USER"
    GUEST = "GUEST"


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, nullable=True, index=True)
    name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmailVerificationCode(Base):
    """Email verification code model."""

    __tablename__ = "email_verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RestaurantSettings(Base):
    """Глобальные настройки ресторана"""

    __tablename__ = "restaurant_settings"

    id = Column(Integer, primary_key=True, index=True)
    opening_time = Column(Time, default=time(12, 0), nullable=False)
    closing_time = Column(Time, default=time(23, 0), nullable=False)
    last_booking_time = Column(Time, default=time(21, 0), nullable=False)
    min_advance_hours = Column(
        Integer, default=3, nullable=False
    )  # Бронь минимум за 3 часа
    booking_duration_hours = Column(
        Integer, default=2, nullable=False
    )  # Длительность стола
    timezone = Column(String, default="Europe/Moscow", nullable=False)


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    zone = Column(SQLEnum(Zone), nullable=False)
    seats = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    rotation = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)

    bookings = relationship("Booking", back_populates="table")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, nullable=False)
    user_phone = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    guest_count = Column(Integer, nullable=False)
    status = Column(
        SQLEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False
    )
    deposit_amount = Column(Float, default=0.0, nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    table = relationship("Table", back_populates="bookings")


class MenuCategory(Base):
    """Menu category model."""

    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    items = relationship(
        "MenuItem", back_populates="category", cascade="all, delete-orphan"
    )


class MenuItem(Base):
    """Menu item model."""

    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    weight = Column(Integer, nullable=False)  # in grams

    # CHANGED: Используем Text для хранения длинных Base64 строк изображений
    image_url = Column(Text, nullable=True)

    category_id = Column(Integer, ForeignKey("menu_categories.id"), nullable=False)
    is_spicy = Column(Boolean, default=False, nullable=False)
    is_vegan = Column(Boolean, default=False, nullable=False)

    # Relationships
    category = relationship("MenuCategory", back_populates="items")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    author = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=True)  # Text может быть пустым

    # Храним JSON строку: '["base64...", "base64..."]'
    images_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_approved = Column(Boolean, default=True, nullable=False)

    # Вспомогательное свойство для удобства (не обязательно, но полезно)
    @property
    def images(self):
        import json

        if not self.images_json:
            return []
        try:
            return json.loads(self.images_json)
        except:
            return []

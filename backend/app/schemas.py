"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date, time, datetime
from typing import Optional, List
from app.models import Zone, BookingStatus, UserRole


# ============ USER SCHEMAS ============

class UserCreate(BaseModel):
    """Schema for creating a user."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: str = Field(..., min_length=5)
    name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.USER


class EmailVerificationRequest(BaseModel):
    """Schema for requesting email verification code."""
    email: str = Field(..., min_length=5)


class EmailVerificationConfirm(BaseModel):
    """Schema for confirming email verification."""
    email: str = Field(..., min_length=5)
    code: str = Field(..., min_length=4, max_length=6)


class UserRegister(BaseModel):
    """Schema for user registration with verification code."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: str = Field(..., min_length=5)
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=4, max_length=6)


class UserRead(BaseModel):
    """Schema for reading user data."""
    id: int
    username: str
    email: str | None
    name: str | None
    role: UserRole
    is_verified: bool
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data for JWT."""
    username: Optional[str] = None


# ============ TABLE SCHEMAS ============

class TableCreate(BaseModel):
    """Schema for creating a table."""
    zone: Zone
    seats: int = Field(..., gt=0, le=20)
    x: float
    y: float
    rotation: float = 0.0
    is_active: bool = True


class TableRead(BaseModel):
    """Schema for reading table data (includes coordinates for SVG)."""
    id: int
    zone: Zone
    seats: int
    x: float
    y: float
    rotation: float
    is_active: bool
    
    class Config:
        from_attributes = True


# ============ MENU SCHEMAS ============

class MenuCategoryCreate(BaseModel):
    """Schema for creating a menu category."""
    title: str = Field(..., min_length=1, max_length=100)
    sort_order: int = 0


class MenuCategoryRead(BaseModel):
    """Schema for reading menu category."""
    id: int
    title: str
    sort_order: int
    
    class Config:
        from_attributes = True


class MenuItemCreate(BaseModel):
    """Schema for creating a menu item."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    weight: int = Field(..., gt=0)
    image_url: Optional[str] = None
    category_id: int
    is_spicy: bool = False
    is_vegan: bool = False


class MenuItemRead(BaseModel):
    """Schema for reading menu item."""
    id: int
    title: str
    description: Optional[str]
    price: float
    weight: int
    image_url: Optional[str]
    category_id: int
    is_spicy: bool
    is_vegan: bool
    
    class Config:
        from_attributes = True


class MenuCategoryWithItems(MenuCategoryRead):
    """Menu category with items."""
    items: List[MenuItemRead] = []


# ============ BOOKING SCHEMAS ============

class BookingCreate(BaseModel):
    """Schema for creating a booking."""
    user_name: str = Field(..., min_length=2, max_length=100)
    user_phone: str = Field(..., min_length=10, max_length=20)
    date: date
    time: time
    guest_count: int = Field(..., gt=0, le=20)
    table_id: Optional[int] = None
    comment: Optional[str] = None
    
    @field_validator('time', mode='before')
    @classmethod
    def parse_time(cls, v):
        """Parse time from string if needed."""
        if isinstance(v, str):
            # Parse "HH:MM" format
            try:
                parts = v.split(':')
                if len(parts) == 2:
                    return time(int(parts[0]), int(parts[1]))
            except (ValueError, IndexError):
                pass
        return v
    
    @field_validator('date')
    @classmethod
    def validate_date_not_past(cls, v: date) -> date:
        """Validate that date is not in the past."""
        if v < date.today():
            raise ValueError("Дата бронирования не может быть в прошлом")
        return v
    
    @field_validator('user_phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Basic phone validation."""
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, v))
        if len(digits) < 10:
            raise ValueError("Некорректный номер телефона")
        return v
    
    @model_validator(mode='after')
    def validate_booking_time_advance(self):
        """Validate that booking is made at least 3 hours in advance."""
        from datetime import datetime, timedelta
        
        booking_datetime = datetime.combine(self.date, self.time)
        now = datetime.now()
        min_advance = timedelta(hours=3)
        
        # Check if date is in the past
        if self.date < now.date():
            raise ValueError("Дата бронирования не может быть в прошлом")
        
        # For today's date, check if booking is at least 3 hours in advance
        if self.date == now.date():
            if booking_datetime < now + min_advance:
                raise ValueError("Бронирование должно быть сделано минимум за 3 часа до выбранного времени")
        
        # For future dates, allow any time (no validation needed)
        
        return self


class BookingRead(BaseModel):
    """Schema for reading booking data."""
    id: int
    user_name: str
    user_phone: str
    date: date
    time: time
    guest_count: int
    status: BookingStatus
    deposit_amount: float
    table_id: Optional[int]
    comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class BookingAvailabilityRequest(BaseModel):
    """Request for checking table availability."""
    date: date
    time: time


class BookingAvailabilityResponse(BaseModel):
    """Response with list of occupied table IDs."""
    occupied_table_ids: List[int]
    available_table_ids: List[int]


class BookingPaymentResponse(BaseModel):
    """Response with payment link after booking creation."""
    booking_id: int
    payment_url: str
    status: BookingStatus


class BookingWebhookRequest(BaseModel):
    """Webhook request from payment system."""
    booking_id: int
    payment_status: str = "success"  # success, failed, cancelled


class YooKassaWebhookRequest(BaseModel):
    """Webhook request from YooKassa."""
    type: str
    event: str
    object: dict


# ============ STATS SCHEMAS ============

class StatsResponse(BaseModel):
    """Statistics response for admin panel."""
    total_deposits: float
    total_guests: int
    total_bookings: int
    confirmed_bookings: int
    pending_bookings: int
    cancelled_bookings: int


# ============ REVIEW SCHEMAS ============

class ReviewCreate(BaseModel):
    """Schema for creating a review."""
    author: str = Field(..., min_length=2, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=10, max_length=1000)
    image_url: Optional[str] = None


class ReviewRead(BaseModel):
    """Schema for reading review data."""
    id: int
    author: str
    rating: int
    text: str
    image_url: Optional[str]
    created_at: datetime
    is_approved: bool
    
    class Config:
        from_attributes = True


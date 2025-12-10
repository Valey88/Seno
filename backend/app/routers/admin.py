"""
Admin router - handles admin panel statistics and management.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Booking, BookingStatus, User
from app.schemas import StatsResponse
from app.auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get statistics for admin panel.
    Returns total deposits, guest count, and booking counts by status.
    """
    # Total deposits (only confirmed bookings)
    deposits_result = await db.execute(
        select(func.sum(Booking.deposit_amount))
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    total_deposits = deposits_result.scalar() or 0.0
    
    # Total guests
    guests_result = await db.execute(
        select(func.sum(Booking.guest_count))
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    total_guests = guests_result.scalar() or 0
    
    # Total bookings
    total_result = await db.execute(select(func.count(Booking.id)))
    total_bookings = total_result.scalar() or 0
    
    # Confirmed bookings
    confirmed_result = await db.execute(
        select(func.count(Booking.id))
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    confirmed_bookings = confirmed_result.scalar() or 0
    
    # Pending bookings
    pending_result = await db.execute(
        select(func.count(Booking.id))
        .where(Booking.status == BookingStatus.PENDING)
    )
    pending_bookings = pending_result.scalar() or 0
    
    # Cancelled bookings
    cancelled_result = await db.execute(
        select(func.count(Booking.id))
        .where(Booking.status == BookingStatus.CANCELLED)
    )
    cancelled_bookings = cancelled_result.scalar() or 0
    
    return StatsResponse(
        total_deposits=float(total_deposits),
        total_guests=total_guests,
        total_bookings=total_bookings,
        confirmed_bookings=confirmed_bookings,
        pending_bookings=pending_bookings,
        cancelled_bookings=cancelled_bookings
    )


"""
Booking service with business logic for table availability and booking management.
"""
from datetime import date, time, datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models import Booking, Table, BookingStatus


# Booking duration in hours
BOOKING_DURATION_HOURS = 2


async def get_occupied_tables(
    db: AsyncSession,
    booking_date: date,
    booking_time: time
) -> List[int]:
    """
    Get list of table IDs that are occupied at the given date and time.
    
    A booking lasts 2 hours, so we need to check for overlapping bookings.
    """
    # Calculate booking start and end times
    booking_datetime = datetime.combine(booking_date, booking_time)
    booking_start = booking_datetime
    booking_end = booking_datetime + timedelta(hours=BOOKING_DURATION_HOURS)
    
    occupied_table_ids = []
    
    # Check each booking for time overlap
    bookings = await db.execute(
        select(Booking)
        .where(
            and_(
                Booking.date == booking_date,
                Booking.status == BookingStatus.CONFIRMED,
                Booking.table_id.isnot(None)
            )
        )
    )
    
    for booking in bookings.scalars():
        existing_start = datetime.combine(booking.date, booking.time)
        existing_end = existing_start + timedelta(hours=BOOKING_DURATION_HOURS)
        
        # Check for overlap
        if booking_start < existing_end and booking_end > existing_start:
            if booking.table_id and booking.table_id not in occupied_table_ids:
                occupied_table_ids.append(booking.table_id)
    
    return occupied_table_ids


async def check_table_availability(
    db: AsyncSession,
    table_id: int,
    booking_date: date,
    booking_time: time
) -> bool:
    """
    Check if a specific table is available at the given date and time.
    """
    occupied_ids = await get_occupied_tables(db, booking_date, booking_time)
    return table_id not in occupied_ids


async def get_available_tables(
    db: AsyncSession,
    booking_date: date,
    booking_time: time,
    guest_count: int
) -> List[Table]:
    """
    Get list of available tables that can accommodate the guest count.
    """
    # Get all active tables with enough seats
    result = await db.execute(
        select(Table)
        .where(
            and_(
                Table.is_active == True,
                Table.seats >= guest_count
            )
        )
    )
    all_tables = result.scalars().all()
    
    # Get occupied table IDs
    occupied_ids = await get_occupied_tables(db, booking_date, booking_time)
    
    # Filter out occupied tables
    available_tables = [t for t in all_tables if t.id not in occupied_ids]
    
    return available_tables


def calculate_deposit_amount(guest_count: int) -> float:
    """
    Calculate deposit amount based on guest count.
    Simple logic: 500₽ fixed deposit
    """
    return 500.0


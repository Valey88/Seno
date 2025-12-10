"""
Booking router - handles booking creation, availability checks, and webhooks.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, time

from app.database import get_db
from app.models import Booking, Table, BookingStatus, User, UserRole
from app.schemas import (
    BookingCreate,
    BookingRead,
    BookingAvailabilityRequest,
    BookingAvailabilityResponse,
    BookingPaymentResponse,
    BookingWebhookRequest,
    YooKassaWebhookRequest
)
from app.services.booking_service import (
    get_occupied_tables,
    check_table_availability,
    get_available_tables,
    calculate_deposit_amount
)
from app.services.telegram_service import send_booking_notification
from app.services.payment_service import payment_service
from app.auth import get_current_user, get_current_admin_user
from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import List
from sqlalchemy import desc

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/availability", response_model=BookingAvailabilityResponse)
async def check_availability(
    request: BookingAvailabilityRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Check table availability for a given date and time.
    Returns list of occupied and available table IDs.
    """
    occupied_ids = await get_occupied_tables(db, request.date, request.time)
    
    # Get all active table IDs
    result = await db.execute(select(Table.id).where(Table.is_active == True))
    all_table_ids = [row[0] for row in result.all()]
    
    available_ids = [tid for tid in all_table_ids if tid not in occupied_ids]
    
    return BookingAvailabilityResponse(
        occupied_table_ids=occupied_ids,
        available_table_ids=available_ids
    )


@router.post("", response_model=BookingPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new booking.
    
    If table_id is provided, checks if the table is available.
    If not provided, automatically selects an available table.
    Returns payment link.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Creating booking: {booking_data.model_dump()}")
        logger.info(f"Date type: {type(booking_data.date)}, Time type: {type(booking_data.time)}")
        logger.info(f"Date value: {booking_data.date}, Time value: {booking_data.time}")
        
        # Check if table is specified and available
        if booking_data.table_id:
            # Verify table exists and is active
            result = await db.execute(
                select(Table).where(
                    and_(
                        Table.id == booking_data.table_id,
                        Table.is_active == True
                    )
                )
            )
            table = result.scalar_one_or_none()
            
            if not table:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Стол не найден или неактивен"
                )
            
            # Check if table has enough seats
            if table.seats < booking_data.guest_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Стол №{table.id} вмещает только {table.seats} гостей"
                )
            
            # Check availability
            is_available = await check_table_availability(
                db,
                booking_data.table_id,
                booking_data.date,
                booking_data.time
            )
            
            if not is_available:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Стол №{booking_data.table_id} уже занят на это время"
                )
        else:
            # Auto-select available table
            available_tables = await get_available_tables(
                db,
                booking_data.date,
                booking_data.time,
                booking_data.guest_count
            )
            
            if not available_tables:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Нет свободных столов на это время"
                )
            
            # Select table with minimum seats that fits
            table = min(available_tables, key=lambda t: t.seats)
            booking_data.table_id = table.id
        
        # Calculate deposit
        deposit_amount = calculate_deposit_amount(booking_data.guest_count)
        
        # Create booking
        booking = Booking(
            user_name=booking_data.user_name,
            user_phone=booking_data.user_phone,
            date=booking_data.date,
            time=booking_data.time,
            guest_count=booking_data.guest_count,
            table_id=booking_data.table_id,
            comment=booking_data.comment,
            status=BookingStatus.PENDING,
            deposit_amount=deposit_amount
        )
        
        db.add(booking)
        await db.commit()
        await db.refresh(booking)
        
        # Create payment in YooKassa
        try:
            description = f"Бронирование стола на {booking_data.date.strftime('%d.%m.%Y')} в {booking_data.time.strftime('%H:%M')} для {booking_data.guest_count} гостей"
            
            payment_info = await payment_service.create_payment(
                amount=deposit_amount,
                booking_id=booking.id,
                description=description,
                customer_phone=booking_data.user_phone,
                customer_name=booking_data.user_name
            )
            
            # Get confirmation URL from payment info
            confirmation = payment_info.get("confirmation", {})
            payment_url = confirmation.get("confirmation_url", "")
            
            if not payment_url:
                logger.warning(f"No confirmation URL in payment response: {payment_info}")
                # Fallback to mock URL if payment creation fails
                payment_url = f"https://yookassa.ru/payment?booking_id={booking.id}&amount={deposit_amount}"
            
            # Store payment ID in booking (you might want to add a payment_id field to Booking model)
            logger.info(f"Payment created for booking {booking.id}: {payment_info.get('id')}")
            
        except Exception as payment_error:
            logger.error(f"Failed to create payment in YooKassa: {str(payment_error)}")
            # Fallback to mock URL if payment service is not configured
            payment_url = f"https://yookassa.ru/payment?booking_id={booking.id}&amount={deposit_amount}"
        
        return BookingPaymentResponse(
            booking_id=booking.id,
            payment_url=payment_url,
            status=booking.status
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания бронирования: {str(e)}"
        )


@router.post("/yookassa-webhook", status_code=status.HTTP_200_OK)
async def yookassa_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Webhook endpoint for YooKassa payment notifications.
    This endpoint receives notifications from YooKassa about payment status changes.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Get raw JSON from request
        webhook_data = await request.json()
        
        # Verify webhook
        if not payment_service.verify_webhook(webhook_data):
            logger.warning(f"Invalid webhook data: {webhook_data}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверные данные webhook"
            )
        
        # Extract payment object
        payment_object = webhook_data.get("object", {})
        payment_id = payment_object.get("id")
        payment_status = payment_object.get("status")
        metadata = payment_object.get("metadata", {})
        booking_id = metadata.get("booking_id")
        
        if not booking_id:
            logger.warning(f"No booking_id in webhook metadata: {webhook_data}")
            return {"status": "ok", "message": "No booking_id in metadata"}
        
        booking_id = int(booking_id)
        
        # Get booking
        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        
        if not booking:
            logger.warning(f"Booking {booking_id} not found for payment {payment_id}")
            return {"status": "ok", "message": "Booking not found"}
        
        # Update booking status based on payment status
        event = webhook_data.get("event")
        
        if event == "payment.succeeded" and payment_status == "succeeded":
            booking.status = BookingStatus.CONFIRMED
            await db.commit()
            await db.refresh(booking)
            
            # Get table info for notification
            if booking.table_id:
                result = await db.execute(select(Table).where(Table.id == booking.table_id))
                table = result.scalar_one_or_none()
            else:
                table = None
            
            # Send Telegram notification
            await send_booking_notification(booking, table)
            
            logger.info(f"Booking {booking_id} confirmed via YooKassa payment {payment_id}")
            return {"status": "confirmed", "message": "Бронирование подтверждено"}
            
        elif event == "payment.canceled" or payment_status == "canceled":
            booking.status = BookingStatus.CANCELLED
            await db.commit()
            logger.info(f"Booking {booking_id} cancelled via YooKassa payment {payment_id}")
            return {"status": "cancelled", "message": "Платеж отменен"}
        else:
            logger.info(f"Payment {payment_id} for booking {booking_id} has status: {payment_status}")
            return {"status": "ok", "message": f"Payment status: {payment_status}"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing YooKassa webhook: {str(e)}", exc_info=True)
        # Return 200 to prevent YooKassa from retrying
        return {"status": "error", "message": str(e)}


@router.post("/{booking_id}/webhook", status_code=status.HTTP_200_OK)
async def booking_webhook(
    booking_id: int,
    webhook_data: BookingWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Legacy webhook endpoint for payment system to update booking status.
    This is kept for backward compatibility.
    """
    # Get booking
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Update status based on payment result
    if webhook_data.payment_status == "success":
        booking.status = BookingStatus.CONFIRMED
        await db.commit()
        await db.refresh(booking)
        
        # Get table info for notification
        if booking.table_id:
            result = await db.execute(select(Table).where(Table.id == booking.table_id))
            table = result.scalar_one_or_none()
        else:
            table = None
        
        # Send Telegram notification
        await send_booking_notification(booking, table)
        
        return {"status": "confirmed", "message": "Бронирование подтверждено"}
    elif webhook_data.payment_status == "failed":
        booking.status = BookingStatus.CANCELLED
        await db.commit()
        return {"status": "cancelled", "message": "Оплата не прошла"}
    else:
        return {"status": "unknown", "message": "Неизвестный статус платежа"}


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Security(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    try:
        from app.auth import oauth2_scheme
        # Manually decode token
        from jose import JWTError, jwt
        from app.database import settings
        from app.schemas import TokenData
        from app.auth import get_user_by_username
        
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
        user = await get_user_by_username(db, username=token_data.username)
        return user
    except:
        return None


@router.get("", response_model=List[BookingRead])
async def get_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Get all bookings.
    For admin: returns all bookings.
    For regular users: returns only their bookings (by phone).
    For unauthenticated users: returns empty list.
    """
    if not current_user:
        return []
    
    query = select(Booking).order_by(desc(Booking.created_at))
    
    # If not admin, filter by user phone
    if current_user.role != UserRole.ADMIN:
        query = query.where(Booking.user_phone == current_user.username)
    
    result = await db.execute(query)
    bookings = result.scalars().all()
    
    return bookings


@router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get booking by ID."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    return booking


@router.put("/{booking_id}/status", response_model=BookingRead)
async def update_booking_status(
    booking_id: int,
    status_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update booking status (Admin only)."""
    status_value = status_data.get('status')
    if not status_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Статус не указан"
        )
    
    try:
        booking_status = BookingStatus(status_value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Некорректный статус: {status_value}"
        )
    
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    booking.status = booking_status
    await db.commit()
    await db.refresh(booking)
    
    return booking


@router.put("/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: int,
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update booking details (Admin only)."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Update fields
    booking.user_name = booking_data.user_name
    booking.user_phone = booking_data.user_phone
    booking.date = booking_data.date
    booking.time = booking_data.time
    booking.guest_count = booking_data.guest_count
    booking.table_id = booking_data.table_id
    booking.comment = booking_data.comment
    
    await db.commit()
    await db.refresh(booking)
    
    return booking


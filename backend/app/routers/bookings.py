"""
Booking router - handles booking creation, availability checks, and webhooks.
"""

from datetime import date, time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user, get_current_user
from app.database import get_db
from app.models import Booking, BookingStatus, Table, User, UserRole
from app.schemas import (
    BookingCreate,
    BookingPaymentResponse,
    BookingRead,
    BookingWebhookRequest,
    DateAvailabilityResponse,
)
from app.services.booking_service import (
    calculate_deposit_amount,
    find_available_table,
    get_day_availability,
    validate_booking_request,
)
from app.services.payment_service import payment_service
from app.services.telegram_service import send_booking_notification

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/availability/{date_str}", response_model=DateAvailabilityResponse)
async def get_date_availability(
    date_str: date,
    guest_count: int = Query(2, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    """
    Get full day availability with time slots.
    Checks:
    1. Working hours
    2. 3-hour advance rule
    3. Table intervals (2 hours duration)
    """
    return await get_day_availability(db, date_str, guest_count)


@router.post(
    "", response_model=BookingPaymentResponse, status_code=status.HTTP_201_CREATED
)
async def create_booking(
    booking_data: BookingCreate, db: AsyncSession = Depends(get_db)
):
    """
    Create a new booking.

    1. Validates time rules (3 hours advance, working hours).
    2. Checks table availability (intervals).
    3. Auto-selects table if not provided.
    4. Returns payment link.
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"Creating booking: {booking_data.model_dump()}")

        # 1. Strict Business Logic Validation
        logger.info("Starting validation...")
        try:
            await validate_booking_request(db, booking_data)
            logger.info("Validation passed")
        except ValueError as e:
            error_message = str(e)
            logger.error(f"Validation failed: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        except Exception as e:
            logger.error(f"Validation Unexpected Error: {type(e)} - {e}")
            raise

        # 2. Table Selection Logic
        final_table_id = booking_data.table_id

        if not final_table_id:
            # Auto-select available table
            final_table_id = await find_available_table(
                db, booking_data.date, booking_data.time, booking_data.guest_count
            )

            if not final_table_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="К сожалению, на это время все подходящие столы заняты.",
                )

        # 3. Calculate deposit
        deposit_amount = calculate_deposit_amount(booking_data.guest_count)

        # 4. Create booking record
        booking = Booking(
            user_name=booking_data.user_name,
            user_phone=booking_data.user_phone,
            date=booking_data.date,
            time=booking_data.time,
            guest_count=booking_data.guest_count,
            table_id=final_table_id,
            comment=booking_data.comment,
            status=BookingStatus.PENDING,
            deposit_amount=deposit_amount,
        )

        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        # 5. Create payment in YooKassa
        payment_url = ""
        try:
            description = f"Бронирование стола на {booking_data.date.strftime('%d.%m.%Y')} в {booking_data.time.strftime('%H:%M')} для {booking_data.guest_count} гостей"

            # Assuming payment_service is configured
            payment_info = await payment_service.create_payment(
                amount=deposit_amount,
                booking_id=booking.id,
                description=description,
                customer_phone=booking_data.user_phone,
                customer_name=booking_data.user_name,
            )

            confirmation = payment_info.get("confirmation", {})
            payment_url = confirmation.get("confirmation_url", "")

            if not payment_url:
                logger.warning(
                    f"No confirmation URL in payment response: {payment_info}"
                )
                payment_url = f"https://yookassa.ru/payment?booking_id={booking.id}&amount={deposit_amount}"

        except Exception as payment_error:
            logger.error(f"Failed to create payment in YooKassa: {str(payment_error)}")
            # Fallback URL for testing or manual handling
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
            detail=f"Ошибка создания бронирования: {str(e)}",
        )


@router.post("/yookassa-webhook", status_code=status.HTTP_200_OK)
async def yookassa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook endpoint for YooKassa payment notifications.
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        webhook_data = await request.json()

        # Verify webhook signature if needed
        if not payment_service.verify_webhook(webhook_data):
            logger.warning(f"Invalid webhook data: {webhook_data}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверные данные webhook",
            )

        payment_object = webhook_data.get("object", {})
        payment_id = payment_object.get("id")
        payment_status = payment_object.get("status")
        metadata = payment_object.get("metadata", {})
        booking_id = metadata.get("booking_id")

        if not booking_id:
            return {"status": "ok", "message": "No booking_id in metadata"}

        booking_id = int(booking_id)

        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()

        if not booking:
            return {"status": "ok", "message": "Booking not found"}

        event = webhook_data.get("event")

        if event == "payment.succeeded" and payment_status == "succeeded":
            if booking.status != BookingStatus.CONFIRMED:
                booking.status = BookingStatus.CONFIRMED
                await db.commit()
                await db.refresh(booking)

                # Get table info for notification
                table = None
                if booking.table_id:
                    result = await db.execute(
                        select(Table).where(Table.id == booking.table_id)
                    )
                    table = result.scalar_one_or_none()

                await send_booking_notification(booking, table)
                logger.info(
                    f"Booking {booking_id} confirmed via YooKassa payment {payment_id}"
                )

            return {"status": "confirmed", "message": "Бронирование подтверждено"}

        elif event == "payment.canceled" or payment_status == "canceled":
            booking.status = BookingStatus.CANCELLED
            await db.commit()
            return {"status": "cancelled", "message": "Платеж отменен"}
        else:
            return {"status": "ok", "message": f"Payment status: {payment_status}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing YooKassa webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@router.post("/{booking_id}/webhook", status_code=status.HTTP_200_OK)
async def booking_webhook(
    booking_id: int,
    webhook_data: BookingWebhookRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Legacy webhook endpoint for internal payment simulation.
    """
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if webhook_data.payment_status == "success":
        booking.status = BookingStatus.CONFIRMED
        await db.commit()
        await db.refresh(booking)

        table = None
        if booking.table_id:
            result = await db.execute(select(Table).where(Table.id == booking.table_id))
            table = result.scalar_one_or_none()

        await send_booking_notification(booking, table)
        return {"status": "confirmed"}

    elif webhook_data.payment_status == "failed":
        booking.status = BookingStatus.CANCELLED
        await db.commit()
        return {"status": "cancelled"}

    return {"status": "unknown"}


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Security(
        HTTPBearer(auto_error=False)
    ),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    try:
        from jose import jwt

        from app.auth import get_user_by_username
        from app.database import settings
        from app.schemas import TokenData

        # Note: In a real app, import settings properly.
        # Assuming settings is available in app.database or app.config
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
        user = await get_user_by_username(db, username=token_data.username)
        return user
    except Exception:
        return None


@router.get("", response_model=List[BookingRead])
async def get_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Get all bookings.
    Admin sees all, User sees own, Guest sees none.
    """
    if not current_user:
        return []

    query = select(Booking).order_by(desc(Booking.created_at))

    if current_user.role != UserRole.ADMIN:
        query = query.where(Booking.user_phone == current_user.username)

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings


@router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    """Get booking by ID."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Бронирование не найдено"
        )

    return booking


@router.put("/{booking_id}/status", response_model=BookingRead)
async def update_booking_status(
    booking_id: int,
    status_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update booking status (Admin only)."""
    status_value = status_data.get("status")
    if not status_value:
        raise HTTPException(status_code=400, detail="Статус не указан")

    try:
        booking_status = BookingStatus(status_value)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Некорректный статус: {status_value}"
        )

    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")

    booking.status = booking_status
    await db.commit()
    await db.refresh(booking)

    return booking


@router.put("/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: int,
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Update booking details (Admin only).
    Note: Ideally, should also run validate_booking_request if date/time changes.
    """
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")

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

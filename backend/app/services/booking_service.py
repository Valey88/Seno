from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Booking, BookingStatus, RestaurantSettings, Table

# Настройки по умолчанию, если таблица настроек пуста
DEFAULT_SETTINGS = {
    "opening_time": time(12, 0),
    "closing_time": time(23, 0),
    "last_booking_time": time(21, 0),
    "min_advance_hours": 3,
    "booking_duration_hours": 2,
    "timezone": "Europe/Moscow",
}


async def get_settings(db: AsyncSession) -> RestaurantSettings:
    """
    Получает настройки из БД. Если их нет, возвращает дефолтный объект (не сохраненный в БД).
    """
    result = await db.execute(select(RestaurantSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        return RestaurantSettings(**DEFAULT_SETTINGS)
    return settings


async def get_occupied_intervals(
    db: AsyncSession, target_date: date, duration_hours: int
) -> List[Dict[str, Any]]:
    """
    Получает список занятых интервалов для всех столов на указанную дату.
    Возвращает: [{'table_id': 1, 'start': datetime, 'end': datetime}, ...]
    Учитываются только подтвержденные брони.
    """
    query = select(Booking).where(
        and_(
            Booking.date == target_date,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.table_id.isnot(None),
        )
    )
    result = await db.execute(query)
    bookings = result.scalars().all()

    intervals = []
    for booking in bookings:
        # start_dt создается наивным (без timezone), так как date/time в БД обычно хранятся без TZ
        start_dt = datetime.combine(booking.date, booking.time)
        end_dt = start_dt + timedelta(hours=duration_hours)
        intervals.append(
            {"table_id": booking.table_id, "start": start_dt, "end": end_dt}
        )
    return intervals


async def get_day_availability(
    db: AsyncSession, target_date: date, guest_count: int
) -> Dict[str, Any]:
    """
    Основная функция для формирования сетки бронирования.
    """
    settings = await get_settings(db)

    try:
        tz = ZoneInfo(settings.timezone)
    except Exception:
        tz = ZoneInfo("Europe/Moscow")  # Fallback

    now = datetime.now(tz)

    # 1. Получаем список столов, подходящих по вместимости
    tables_result = await db.execute(
        select(Table).where(and_(Table.is_active == True, Table.seats >= guest_count))
    )
    suitable_tables = tables_result.scalars().all()
    suitable_table_ids = {t.id for t in suitable_tables}

    # Если столов под такое кол-во гостей нет вообще
    if not suitable_table_ids:
        return {
            "date": target_date,
            "time_slots": [],
            "working_hours": {
                "open": settings.opening_time,
                "close": settings.closing_time,
            },
            "min_advance_hours": settings.min_advance_hours,
        }

    # 2. Получаем занятые интервалы на этот день
    occupied_intervals = await get_occupied_intervals(
        db, target_date, settings.booking_duration_hours
    )

    # 3. Генерируем временные слоты с шагом 30 минут
    time_slots = []

    # Старт перебора: от времени открытия
    current_dt = datetime.combine(target_date, settings.opening_time).replace(tzinfo=tz)

    # Конец перебора: время последней посадки
    limit_dt = datetime.combine(target_date, settings.last_booking_time).replace(
        tzinfo=tz
    )

    # Пороговое время: Текущее время + min_advance_hours
    min_booking_threshold = now + timedelta(hours=settings.min_advance_hours)

    while current_dt <= limit_dt:
        slot_time = current_dt.time()
        slot_end_dt = current_dt + timedelta(hours=settings.booking_duration_hours)

        is_available = True
        reason = None
        available_count = 0

        # ПРОВЕРКА 1: Правило min_advance_hours (или прошло ли время)
        if current_dt < min_booking_threshold:
            is_available = False
            reason = "too_late"  # Слишком поздно для бронирования
        else:
            # ПРОВЕРКА 2: Наличие свободных столов
            free_tables = 0

            for table_id in suitable_table_ids:
                is_table_busy = False

                for interval in occupied_intervals:
                    if interval["table_id"] == table_id:
                        # Приводим интервалы из БД к TZ-aware для сравнения
                        occ_start = interval["start"].replace(tzinfo=tz)
                        occ_end = interval["end"].replace(tzinfo=tz)

                        # Проверка пересечения интервалов:
                        if current_dt < occ_end and slot_end_dt > occ_start:
                            is_table_busy = True
                            break

                if not is_table_busy:
                    free_tables += 1

            available_count = free_tables

            if available_count == 0:
                is_available = False
                reason = "fully_booked"

        time_slots.append(
            {
                "time": slot_time,
                "is_available": is_available,
                "available_tables_count": available_count,
                "reason": reason,
            }
        )

        current_dt += timedelta(minutes=30)

    return {
        "date": target_date,
        "time_slots": time_slots,
        "working_hours": {
            "open": settings.opening_time,
            "close": settings.closing_time,
        },
        "min_advance_hours": settings.min_advance_hours,
    }


async def validate_booking_request(db: AsyncSession, booking_data: Any):
    """
    Строгая валидация входящего запроса на создание брони.
    """
    settings = await get_settings(db)

    try:
        tz = ZoneInfo(settings.timezone)
    except Exception:
        tz = ZoneInfo("Europe/Moscow")

    now = datetime.now(tz)
    booking_dt = datetime.combine(booking_data.date, booking_data.time).replace(
        tzinfo=tz
    )

    # 1. Проверка минимального времени
    min_allowed_time = now + timedelta(hours=settings.min_advance_hours)
    if booking_dt < min_allowed_time:
        raise ValueError(
            f"Бронирование возможно минимум за {settings.min_advance_hours} часа до визита."
        )

    # 2. Проверка рабочего времени
    if not (settings.opening_time <= booking_data.time <= settings.last_booking_time):
        raise ValueError("Выбранное время выходит за рамки графика работы ресторана.")

    # 3. Если указан конкретный стол, проверяем его занятость
    if booking_data.table_id:
        table = await db.get(Table, booking_data.table_id)
        if not table or not table.is_active:
            raise ValueError("Указанный стол не существует или неактивен.")

        if table.seats < booking_data.guest_count:
            raise ValueError(
                f"Стол №{table.id} слишком мал для {booking_data.guest_count} гостей."
            )

        occupied = await get_occupied_intervals(
            db, booking_data.date, settings.booking_duration_hours
        )
        slot_end = booking_dt + timedelta(hours=settings.booking_duration_hours)

        for interval in occupied:
            if interval["table_id"] == booking_data.table_id:
                occ_start = interval["start"].replace(tzinfo=tz)
                occ_end = interval["end"].replace(tzinfo=tz)

                if booking_dt < occ_end and slot_end > occ_start:
                    raise ValueError(
                        f"Стол №{booking_data.table_id} уже занят на это время."
                    )


async def find_available_table(
    db: AsyncSession, date_val: date, time_val: time, guest_count: int
) -> Optional[int]:
    """
    Автоматический поиск подходящего свободного стола.
    """
    settings = await get_settings(db)
    try:
        tz = ZoneInfo(settings.timezone)
    except Exception:
        tz = ZoneInfo("Europe/Moscow")

    result = await db.execute(
        select(Table)
        .where(and_(Table.is_active == True, Table.seats >= guest_count))
        .order_by(Table.seats)
    )
    candidate_tables = result.scalars().all()

    if not candidate_tables:
        return None

    occupied = await get_occupied_intervals(
        db, date_val, settings.booking_duration_hours
    )

    booking_start = datetime.combine(date_val, time_val).replace(tzinfo=tz)
    booking_end = booking_start + timedelta(hours=settings.booking_duration_hours)

    for table in candidate_tables:
        is_busy = False
        for interval in occupied:
            if interval["table_id"] == table.id:
                occ_start = interval["start"].replace(tzinfo=tz)
                occ_end = interval["end"].replace(tzinfo=tz)

                if booking_start < occ_end and booking_end > occ_start:
                    is_busy = True
                    break

        if not is_busy:
            return table.id

    return None


def calculate_deposit_amount(guests_count: int) -> float:
    """
    Рассчитывает сумму депозита.
    Здесь вы можете настроить логику (например, фиксированная сумма за человека).
    """
    DEPOSIT_PER_PERSON = 500.0  # Сумма депозита с человека

    if guests_count <= 0:
        return 0.0

    return float(guests_count * DEPOSIT_PER_PERSON)

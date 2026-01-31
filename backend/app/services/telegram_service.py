"""
Telegram bot service for sending booking notifications.
"""
import httpx
from datetime import date, time
from app.database import settings
from app.models import Booking, Table, Zone


async def send_booking_notification(booking: Booking, table: Table = None) -> bool:
    """
    Send a beautiful booking notification to Telegram chat.
    
    Args:
        booking: Booking instance
        table: Table instance (optional)
    
    Returns:
        bool: True if message sent successfully, False otherwise
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        # Mock mode - just log
        print(f"[MOCK] Telegram notification would be sent for booking #{booking.id}")
        return True
    
    # Format zone name in Russian
    zone_names = {
        Zone.HALL_1: "1 зал",
        Zone.HALL_2: "2 зал",
        Zone.HALL_3: "3 зал"
    }
    zone_name = zone_names.get(table.zone, table.zone.value) if table else "Не указан"
    
    # Get table_number (use id as fallback if table_number is not set)
    table_number = table.table_number if table and table.table_number else (str(table.id) if table else "?")
    
    # Format status in Russian
    status_names = {
        "PENDING": "Ожидает оплаты",
        "CONFIRMED": "Подтверждена",
        "CANCELLED": "Отменена"
    }
    status_name = status_names.get(booking.status.value, booking.status.value)
    
    # Build message
    message = f"""🔔 НОВАЯ БРОНЬ!

📅 Дата: {booking.date.strftime('%d.%m.%Y')}
⏰ Время: {booking.time.strftime('%H:%M')}
👥 Гостей: {booking.guest_count}
👤 Имя: {booking.user_name}
📞 Телефон: {booking.user_phone}"""
    
    if table:
        message += f"""
🪑 Стол №{table_number} ({zone_name})
💺 Мест: {table.seats}"""
    
    message += f"""
💰 Депозит: {booking.deposit_amount:.0f}₽
📊 Статус: {status_name}"""
    
    if booking.comment:
        message += f"""
💬 Комментарий: {booking.comment}"""
    
    message += f"""
🆔 ID брони: #{booking.id}"""
    
    return await _send_telegram_message(message)


async def send_booking_update_notification(
    booking: Booking, 
    table: Table = None,
    old_date: date = None,
    old_time: time = None
) -> bool:
    """
    Send a notification when booking date/time is changed.
    
    Args:
        booking: Updated Booking instance
        table: Table instance (optional)
        old_date: Previous date
        old_time: Previous time
    
    Returns:
        bool: True if message sent successfully, False otherwise
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        print(f"[MOCK] Telegram update notification would be sent for booking #{booking.id}")
        return True
    
    # Get table_number
    table_number = table.table_number if table and table.table_number else (str(table.id) if table else "?")
    
    # Build message
    message = f"""✏️ БРОНЬ ИЗМЕНЕНА!

🆔 ID брони: #{booking.id}
👤 Гость: {booking.user_name}
📞 Телефон: {booking.user_phone}

📝 Изменения:"""

    if old_date and old_date != booking.date:
        message += f"""
📅 Дата: {old_date.strftime('%d.%m.%Y')} → {booking.date.strftime('%d.%m.%Y')}"""
    
    if old_time and old_time != booking.time:
        message += f"""
⏰ Время: {old_time.strftime('%H:%M')} → {booking.time.strftime('%H:%M')}"""

    if table:
        message += f"""

🪑 Стол: №{table_number}"""
    
    message += f"""
👥 Гостей: {booking.guest_count}"""
    
    return await _send_telegram_message(message)


async def _send_telegram_message(message: str) -> bool:
    """
    Internal helper to send a message via Telegram Bot API.
    """
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "chat_id": settings.telegram_chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                },
                timeout=10.0
            )
            response.raise_for_status()
            return True
    except Exception as e:
        print(f"Error sending Telegram notification: {e}")
        return False

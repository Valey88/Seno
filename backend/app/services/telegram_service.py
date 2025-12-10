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
🪑 Стол №{table.id} ({zone_name})
💺 Мест: {table.seats}"""
    
    message += f"""
💰 Депозит: {booking.deposit_amount:.0f}₽
📊 Статус: {status_name}"""
    
    if booking.comment:
        message += f"""
💬 Комментарий: {booking.comment}"""
    
    message += f"""
🆔 ID брони: #{booking.id}"""
    
    # Send via Telegram Bot API
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


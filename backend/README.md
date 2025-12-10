# Трактир Сеновал - Backend API

FastAPI backend для ресторана "Трактир Сеновал".

## Технологии

- **Python 3.11+**
- **FastAPI** - асинхронный веб-фреймворк
- **SQLAlchemy (Async)** - ORM для работы с БД
- **SQLite** - база данных (для разработки)
- **Pydantic v2** - валидация данных
- **JWT** - аутентификация
- **Telegram Bot API** - уведомления

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в `.env`:
- `DATABASE_URL` - URL базы данных
- `SECRET_KEY` - секретный ключ для JWT (минимум 32 символа)
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота (опционально)
- `TELEGRAM_CHAT_ID` - ID чата для уведомлений (опционально)

## Запуск

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступен по адресу: http://localhost:8000

Документация API (Swagger): http://localhost:8000/docs

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Точка входа FastAPI
│   ├── database.py           # Настройка БД и сессий
│   ├── models.py             # SQLAlchemy модели
│   ├── schemas.py            # Pydantic схемы
│   ├── auth.py               # JWT аутентификация
│   ├── routers/              # API роутеры
│   │   ├── bookings.py       # Бронирования
│   │   ├── menu.py           # Меню
│   │   ├── tables.py         # Столы
│   │   ├── auth.py           # Аутентификация
│   │   └── admin.py          # Админ-панель
│   └── services/             # Бизнес-логика
│       ├── booking_service.py
│       └── telegram_service.py
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

### Публичные endpoints

- `GET /api/menu` - Получить меню с категориями
- `GET /api/tables` - Получить все столы (для карты зала)
- `GET /api/bookings/availability` - Проверить доступность столов
- `POST /api/bookings` - Создать бронирование
- `POST /api/bookings/{id}/webhook` - Webhook от платежной системы

### Аутентификация

- `POST /api/auth/token` - Получить JWT токен (логин)
- `GET /api/auth/me` - Получить информацию о текущем пользователе

### Админ endpoints (требуют JWT токен)

- `GET /api/admin/stats` - Статистика
- `POST /api/menu/categories` - Создать категорию
- `POST /api/menu/items` - Создать блюдо
- `PUT /api/menu/items/{id}` - Обновить блюдо
- `DELETE /api/menu/items/{id}` - Удалить блюдо
- `POST /api/tables` - Создать стол
- `PUT /api/tables/{id}` - Обновить стол
- `DELETE /api/tables/{id}` - Удалить стол

## Использование JWT токена

После получения токена через `/api/auth/token`, используйте его в заголовке:

```
Authorization: Bearer <your_token>
```

## Создание первого администратора

Для создания первого администратора можно использовать Python скрипт:

```python
import asyncio
from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.auth import get_password_hash

async def create_admin():
    await init_db()
    async with AsyncSessionLocal() as db:
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role="ADMIN"
        )
        db.add(admin)
        await db.commit()
        print("Admin created!")

asyncio.run(create_admin())
```

## База данных

База данных SQLite создается автоматически при первом запуске в файле `senoval.db`.

Для продакшена рекомендуется использовать PostgreSQL. Измените `DATABASE_URL` в `.env`:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/senoval
```

И установите драйвер:
```bash
pip install asyncpg
```


# Быстрый старт

## 1. Установка зависимостей

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

## 2. Настройка окружения

Создайте файл `.env`:

```bash
DATABASE_URL=sqlite+aiosqlite:///./senoval.db
SECRET_KEY=your-secret-key-minimum-32-characters-long-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 3. Инициализация базы данных

```bash
# Создать первого администратора
python create_admin.py

# Загрузить начальные данные (столы, меню)
python init_data.py
```

## 4. Запуск сервера

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 5. Проверка работы

- API: http://localhost:8000
- Документация: http://localhost:8000/docs
- Альтернативная документация: http://localhost:8000/redoc

## Тестирование API

### Получить меню
```bash
curl http://localhost:8000/api/menu
```

### Получить столы
```bash
curl http://localhost:8000/api/tables
```

### Создать бронирование
```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Иван Иванов",
    "user_phone": "+79161234567",
    "date": "2024-12-25",
    "time": "19:00",
    "guest_count": 4,
    "table_id": 201
  }'
```

### Войти как администратор
```bash
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

### Получить статистику (требует токен)
```bash
curl http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```


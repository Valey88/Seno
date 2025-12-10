# Changelog - Backend Updates

## Добавленные функции

### 1. Валидация времени бронирования
- **Минимум за 3 часа**: Бронирование должно быть сделано минимум за 3 часа до выбранного времени
- Валидация реализована в `BookingCreate` schema через `model_validator`
- Ошибка: "Бронирование должно быть сделано минимум за 3 часа до выбранного времени"

### 2. Система отзывов (Reviews)
- **Модель Review**: Добавлена в `app/models.py`
  - Поля: `id`, `author`, `rating` (1-5), `text`, `image_url`, `created_at`, `is_approved`
  - Модерация: отзывы создаются с `is_approved=False`, требуют одобрения админа

- **Роутер `/api/reviews`**:
  - `GET /api/reviews` - Получить все одобренные отзывы (публичный)
  - `POST /api/reviews` - Создать отзыв (публичный, требует модерации)
  - `GET /api/reviews/pending` - Получить неподтвержденные отзывы (Admin)
  - `PUT /api/reviews/{id}/approve` - Одобрить отзыв (Admin)
  - `DELETE /api/reviews/{id}` - Удалить отзыв (Admin)

### 3. Полный CRUD для меню
- **Категории меню**:
  - `POST /api/menu/categories` - Создать категорию (Admin)
  - `PUT /api/menu/categories/{id}` - Обновить категорию (Admin) ✨ НОВОЕ
  - `DELETE /api/menu/categories/{id}` - Удалить категорию (Admin) ✨ НОВОЕ

- **Позиции меню**:
  - `GET /api/menu` - Получить меню (публичный)
  - `POST /api/menu/items` - Создать позицию (Admin)
  - `PUT /api/menu/items/{id}` - Обновить позицию (Admin)
  - `DELETE /api/menu/items/{id}` - Удалить позицию (Admin)

### 4. Полный CRUD для столов
- **Столы**:
  - `GET /api/tables` - Получить все столы (публичный)
  - `POST /api/tables` - Создать стол (Admin)
  - `PUT /api/tables/{id}` - Обновить стол (Admin)
  - `DELETE /api/tables/{id}` - Удалить стол (Admin)

## Алгоритм бронирования

### Валидация времени
1. Дата не может быть в прошлом
2. **Бронирование должно быть сделано минимум за 3 часа** до выбранного времени
3. Телефон должен быть валидным (минимум 10 цифр)

### Проверка доступности
1. Бронирование длится 2 часа
2. Проверяется пересечение временных слотов
3. Учитываются только подтвержденные бронирования (CONFIRMED)
4. Автоматический подбор стола, если не указан

### Расчет депозита
- 500₽ за гостя
- Минимум 1000₽

## API Endpoints Summary

### Публичные endpoints
- `GET /api/menu` - Меню
- `GET /api/tables` - Столы
- `GET /api/bookings/availability` - Проверка доступности
- `POST /api/bookings` - Создать бронирование
- `GET /api/reviews` - Отзывы (только одобренные)
- `POST /api/reviews` - Создать отзыв

### Аутентификация
- `POST /api/auth/token` - Вход (JWT)
- `GET /api/auth/me` - Текущий пользователь

### Админ endpoints (требуют JWT)
- `GET /api/admin/stats` - Статистика

**Меню:**
- `POST /api/menu/categories` - Создать категорию
- `PUT /api/menu/categories/{id}` - Обновить категорию
- `DELETE /api/menu/categories/{id}` - Удалить категорию
- `POST /api/menu/items` - Создать позицию
- `PUT /api/menu/items/{id}` - Обновить позицию
- `DELETE /api/menu/items/{id}` - Удалить позицию

**Столы:**
- `POST /api/tables` - Создать стол
- `PUT /api/tables/{id}` - Обновить стол
- `DELETE /api/tables/{id}` - Удалить стол

**Отзывы:**
- `GET /api/reviews/pending` - Неподтвержденные отзывы
- `PUT /api/reviews/{id}/approve` - Одобрить отзыв
- `DELETE /api/reviews/{id}` - Удалить отзыв

## Примеры использования

### Создание бронирования (с валидацией 3 часа)
```python
POST /api/bookings
{
  "user_name": "Иван Иванов",
  "user_phone": "+79161234567",
  "date": "2024-12-25",
  "time": "19:00",  # Должно быть минимум через 3 часа от текущего времени
  "guest_count": 4,
  "table_id": 201
}
```

### Создание отзыва
```python
POST /api/reviews
{
  "author": "Елена С.",
  "rating": 5,
  "text": "Отличный ресторан!",
  "image_url": "https://..."
}
```

### Обновление стола (изменение координат на карте)
```python
PUT /api/tables/201
{
  "zone": "HALL_2",
  "seats": 4,
  "x": 600,
  "y": 200,
  "rotation": 0,
  "is_active": true
}
```


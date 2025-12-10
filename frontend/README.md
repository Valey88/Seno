# Трактир Сеновал

Ресторанное приложение с бронированием столов, меню и отзывами.

## Технологии

### Frontend
- **Next.js 15** - React фреймворк с App Router
- **TypeScript** - типобезопасность
- **Tailwind CSS** - стилизация
- **Zustand** - state management
- **Axios** - HTTP клиент

### Backend
- **FastAPI** - Python веб-фреймворк
- **SQLAlchemy (Async)** - ORM
- **SQLite/PostgreSQL** - база данных
- **JWT** - аутентификация
- **Pydantic v2** - валидация

## Быстрый старт

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

pip install -r requirements.txt
python create_admin.py
python init_data.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
npm install
cp .env.example .env.local
# Отредактируйте .env.local и установите NEXT_PUBLIC_API_URL

npm run dev
```

Приложение будет доступно на http://localhost:3000

## Структура проекта

```
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/            # React компоненты
├── stores/                # Zustand stores
├── services/              # API клиент
├── types.ts              # TypeScript типы
└── backend/              # FastAPI backend
    ├── app/
    │   ├── main.py
    │   ├── models.py
    │   ├── routers/
    │   └── services/
    └── requirements.txt
```

## Документация

- [Backend README](backend/README.md)
- [Next.js README](README_NEXTJS.md)
- [Интеграция Frontend-Backend](README_INTEGRATION.md)

## Features

- ✅ Бронирование столов с валидацией (минимум за 3 часа)
- ✅ Интерактивная карта залов
- ✅ Меню с категориями
- ✅ Система отзывов с модерацией
- ✅ Админ-панель (CRUD для меню, столов, отзывов)
- ✅ JWT аутентификация
- ✅ Telegram уведомления

## Deployment

### Frontend (Vercel)
1. Подключите репозиторий
2. Установите `NEXT_PUBLIC_API_URL`
3. Deploy

### Backend
Рекомендуется использовать:
- Railway
- Render
- DigitalOcean
- AWS/GCP

## Лицензия

Private

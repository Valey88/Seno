# Настройка Email для регистрации

Для работы регистрации с подтверждением по email необходимо настроить SMTP сервер.

## Настройка переменных окружения

Создайте файл `.env` в папке `backend/` и добавьте следующие переменные:

```env
# SMTP настройки для Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true
```

## Настройка Gmail

1. Включите двухфакторную аутентификацию в вашем Google аккаунте
2. Создайте "Пароль приложения":
   - Перейдите в настройки аккаунта Google
   - Безопасность → Двухэтапная аутентификация → Пароли приложений
   - Создайте новый пароль приложения для "Почта"
   - Используйте этот пароль в `SMTP_PASSWORD`

## Альтернативные SMTP провайдеры

### Yandex Mail
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USE_TLS=false
SMTP_SSL=true
```

### Mail.ru
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USE_TLS=false
SMTP_SSL=true
```

## Режим разработки

Если SMTP не настроен, код подтверждения будет выводиться в логи сервера:
```
INFO: Verification code for user@example.com: 1234
```

Это позволяет тестировать регистрацию без настройки email сервера.

## Проверка работы

1. Запустите бэкенд
2. Откройте форму регистрации на фронтенде
3. Введите email и нажмите "Продолжить"
4. Проверьте email или логи сервера для получения кода
5. Введите код и завершите регистрацию


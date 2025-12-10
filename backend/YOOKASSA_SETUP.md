# Настройка YooKassa

Инструкция по подключению платежной системы YooKassa к приложению.

## 1. Регистрация в YooKassa

1. Зарегистрируйтесь на [https://yookassa.ru](https://yookassa.ru)
2. Пройдите процедуру верификации магазина
3. Получите `shop_id` и `secret_key` в личном кабинете

## 2. Настройка переменных окружения

Добавьте следующие переменные в файл `.env`:

```env
# YooKassa настройки
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
YOOKASSA_RETURN_URL=http://localhost:3000/booking/success
YOOKASSA_TEST_MODE=true
```

### Параметры:

- **YOOKASSA_SHOP_ID** - ID магазина из личного кабинета YooKassa
- **YOOKASSA_SECRET_KEY** - Секретный ключ из личного кабинета YooKassa
- **YOOKASSA_RETURN_URL** - URL, на который пользователь будет перенаправлен после оплаты
- **YOOKASSA_TEST_MODE** - Режим тестирования (`true` для тестов, `false` для продакшена)

## 3. Тестовые данные

Для тестирования используйте тестовые карты:

- **Успешная оплата**: `5555 5555 5555 4444`
- **Отклоненная оплата**: `5555 5555 5555 4477`
- **CVV**: любые 3 цифры
- **Срок действия**: любая будущая дата

## 4. Настройка Webhook

В личном кабинете YooKassa настройте webhook URL:

```
https://ваш-домен.ru/api/bookings/yookassa-webhook
```

YooKassa будет отправлять уведомления о статусе платежей на этот endpoint.

### События, которые обрабатываются:

- `payment.succeeded` - платеж успешно завершен
- `payment.canceled` - платеж отменен

## 5. Проверка работы

1. Создайте бронирование через API
2. Получите `payment_url` из ответа
3. Перейдите по ссылке и выполните тестовый платеж
4. После оплаты статус бронирования автоматически изменится на `CONFIRMED`

## 6. Переход в продакшен

1. Получите продакшен `shop_id` и `secret_key` в YooKassa
2. Обновите переменные окружения:
   ```env
   YOOKASSA_SHOP_ID=продакшен_shop_id
   YOOKASSA_SECRET_KEY=продакшен_secret_key
   YOOKASSA_TEST_MODE=false
   YOOKASSA_RETURN_URL=https://ваш-домен.ru/booking/success
   ```
3. Обновите webhook URL в личном кабинете YooKassa

## 7. Безопасность

⚠️ **Важно:**

- Никогда не коммитьте `.env` файл в репозиторий
- Храните `secret_key` в безопасности
- Используйте HTTPS для продакшена
- В продакшене рекомендуется добавить проверку подписи webhook (см. документацию YooKassa)

## 8. API Endpoints

### Создание платежа

При создании бронирования автоматически создается платеж в YooKassa:

```
POST /api/bookings
```

Ответ содержит `payment_url` для перенаправления пользователя на оплату.

### Webhook от YooKassa

```
POST /api/bookings/yookassa-webhook
```

Этот endpoint принимает уведомления от YooKassa о статусе платежей.

## 9. Дополнительная информация

- [Документация YooKassa API](https://yookassa.ru/developers/api)
- [Руководство по интеграции](https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start)


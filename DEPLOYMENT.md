# 🚀 Полная инструкция по деплою Seno на Ubuntu Server

> **Ваш сервер:** `83.166.247.79` (Reg.ru)  
> **Стек:** Docker, Nginx, Let's Encrypt (SSL)

---

## 📋 Предварительные требования

1. **Сервер** — Ubuntu 22.04/24.04 (уже есть ✅)
2. **Домен** — A-запись указывает на IP сервера
3. **Код** — GitHub репозиторий (или локальные файлы)

---

## 🔐 Шаг 1. Подключение к серверу

```bash
ssh root@83.166.247.79
```
*При первом входе введите `yes`, затем пароль из письма/панели Reg.ru.*

---

## ⚙️ Шаг 2. Установка необходимого ПО

Скопируйте и вставьте **ВЕСЬ** этот блок целиком:

```bash
# 1. Обновление системы
apt update && apt upgrade -y

# 2. Установка инструментов
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# 3. Создание SWAP (критически важно для сборки!)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
echo "vm.swappiness=10" >> /etc/sysctl.conf
sysctl -p

# 4. Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 5. Настройка файрвола
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 📦 Шаг 3. Загрузка кода на сервер

### Вариант A: Через Git (рекомендуется)

```bash
# Создаем SSH-ключ для GitHub
ssh-keygen -t ed25519 -C "server" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```
*Скопируйте вывод и добавьте в GitHub → Settings → Deploy Keys*

Затем:
```bash
cd /opt
git clone git@github.com:Valey88/Seno.git seno
cd seno
```

### Вариант B: Через SCP (с вашего компьютера)

*Выполните на СВОЕМ компьютере, не на сервере:*
```bash
cd ~/Desktop/Seno
scp -r . root@83.166.247.79:/opt/seno
```

---

## 🔧 Шаг 4. Настройка переменных окружения

```bash
cd /opt/seno
cp .env.example .env
nano .env
```

**Заполните ОБЯЗАТЕЛЬНЫЕ поля:**

| Переменная | Что указать |
|------------|-------------|
| `DOMAIN_NAME` | Ваш домен (например: `senoval.ru`) |
| `POSTGRES_PASSWORD` | Придумайте сложный пароль |
| `SECRET_KEY` | Сгенерируйте: `openssl rand -hex 32` |
| `YANDEX_CLIENT_ID` | ID из консоли Яндекс OAuth |
| `YANDEX_CLIENT_SECRET` | Секрет из консоли Яндекс OAuth |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather (опционально) |
| `TELEGRAM_CHAT_ID` | Ваш Chat ID (опционально) |

*Сохранение: `Ctrl+O`, Enter, `Ctrl+X`*

---

## 🐳 Шаг 5. Запуск приложения

```bash
cd /opt/seno
docker compose -f docker-compose.prod.yml up -d --build
```

> ⏱️ **Первая сборка занимает 5-15 минут!**  
> Следите за процессом: `docker compose -f docker-compose.prod.yml logs -f`

Проверка статуса:
```bash
docker ps
```
*Должны быть 3 контейнера: `senoval_db_prod`, `senoval_backend_prod`, `senoval_frontend_prod`*

---

## 🌐 Шаг 6. Настройка Nginx

1. **Создаем конфиг:**
```bash
nano /etc/nginx/sites-available/seno
```

2. **Вставляем (замените `yourdomain.com` на свой домен):**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (FastAPI)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Активируем сайт:**
```bash
ln -sf /etc/nginx/sites-available/seno /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 🔒 Шаг 7. Получение SSL-сертификата (HTTPS)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*Введите email, согласитесь с условиями, выберите редирект на HTTPS.*

---

## 🗄️ Шаг 8. Инициализация базы данных

Создаем администратора и начальные данные:

```bash
# Заходим в контейнер бэкенда
docker exec -it senoval_backend_prod bash

# Внутри контейнера:
python -c "
from app.database import engine, Base
import asyncio
asyncio.run(Base.metadata.create_all(bind=engine))
print('Tables created!')
"

# Выходим
exit
```

Или можно сделать через API (если уже работает):
```bash
curl -X POST https://yourdomain.com/api/init-db-magic
```

---

## ✅ Шаг 9. Проверка

Откройте в браузере:
- 🌍 `https://yourdomain.com` — Главная страница
- 🔧 `https://yourdomain.com/admin` — Админка

---

## 🔄 Обновление приложения

Когда будете обновлять код:

```bash
cd /opt/seno

# Получаем изменения из Git
git pull

# Пересобираем и перезапускаем
docker compose -f docker-compose.prod.yml up -d --build

# Очищаем старые образы (освобождаем место)
docker system prune -f
```

---

## 🛠️ Полезные команды

| Команда | Описание |
|---------|----------|
| `docker ps` | Список запущенных контейнеров |
| `docker logs senoval_backend_prod` | Логи бэкенда |
| `docker logs senoval_frontend_prod` | Логи фронтенда |
| `docker exec -it senoval_db_prod psql -U senoval` | Зайти в БД |
| `docker compose -f docker-compose.prod.yml restart` | Перезапуск |
| `docker compose -f docker-compose.prod.yml down` | Остановка |
| `htop` | Мониторинг ресурсов |
| `df -h` | Свободное место на диске |

---

## ⚠️ Важные замечания

1. **После изменения `.env`** нужно пересобрать контейнеры:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

2. **Яндекс OAuth:** Не забудьте добавить `https://yourdomain.com/api/auth/yandex/callback` в разрешенные Redirect URI в консоли Яндекса.

3. **Бэкапы базы данных:**
   ```bash
   docker exec senoval_db_prod pg_dump -U senoval senoval > backup_$(date +%Y%m%d).sql
   ```

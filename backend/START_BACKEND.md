# Команды для запуска Backend (Windows)

## Вариант 1: Использование PowerShell скрипта (рекомендуется)

```powershell
cd backend
.\activate_venv.ps1
```

Затем выполните:
```powershell
pip install -r requirements.txt
python create_admin.py
python init_data.py
uvicorn app.main:app --reload --port 8000
```

## Вариант 2: Ручная активация

### Шаг 1: Создать виртуальное окружение
```powershell
cd backend
python -m venv venv
```

### Шаг 2: Активировать (выберите один способ)

**Способ A - PowerShell (может требовать изменения политики):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**Способ B - Через CMD (всегда работает):**
```powershell
cmd
venv\Scripts\activate.bat
```

**Способ C - Прямой вызов Python из venv:**
```powershell
# Вместо активации, используйте полный путь:
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe create_admin.py
.\venv\Scripts\python.exe init_data.py
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

## Вариант 3: Без виртуального окружения (не рекомендуется)

Если виртуальное окружение не работает, можно установить глобально:
```powershell
cd backend
pip install -r requirements.txt
python create_admin.py
python init_data.py
uvicorn app.main:app --reload --port 8000
```

## Проверка

После запуска откройте: http://localhost:8000/docs


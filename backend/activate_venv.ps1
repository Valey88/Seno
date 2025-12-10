# Скрипт для активации виртуального окружения в PowerShell

# Переходим в папку backend
Set-Location $PSScriptRoot

# Проверяем наличие venv
if (-not (Test-Path "venv")) {
    Write-Host "Создание виртуального окружения..."
    python -m venv venv
    Start-Sleep -Seconds 3
}

# Активируем виртуальное окружение
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Активация виртуального окружения..."
    & "venv\Scripts\Activate.ps1"
    Write-Host "Виртуальное окружение активировано! (venv)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Теперь выполните:" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Cyan
    Write-Host "  python create_admin.py" -ForegroundColor Cyan
    Write-Host "  python init_data.py" -ForegroundColor Cyan
    Write-Host "  uvicorn app.main:app --reload --port 8000" -ForegroundColor Cyan
} elseif (Test-Path "venv\Scripts\activate.bat") {
    Write-Host "Используйте команду для CMD:" -ForegroundColor Yellow
    Write-Host "  venv\Scripts\activate.bat" -ForegroundColor Cyan
} else {
    Write-Host "Ошибка: виртуальное окружение не создано правильно" -ForegroundColor Red
    Write-Host "Попробуйте создать вручную:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Cyan
}


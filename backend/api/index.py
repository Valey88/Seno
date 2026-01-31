import os
import sys

# Добавляем директорию 'backend' в путь Python, чтобы импортировать 'app'
# Мы находимся в backend/api/index.py, нам нужно подняться на уровень выше в 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

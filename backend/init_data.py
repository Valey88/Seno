"""
Script to initialize database with initial data (tables, menu categories, menu items).
Run: python init_data.py
"""
import asyncio
from app.database import AsyncSessionLocal, init_db
from app.models import Table, MenuCategory, MenuItem, Zone


async def init_data():
    """Initialize database with initial data."""
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # Check if data already exists
        from sqlalchemy import select
        result = await db.execute(select(Table))
        existing_tables = result.scalars().all()
        
        if existing_tables:
            print("Data already initialized!")
            return
        
        # Create tables
        tables_data = [
            # 1 зал
            {"id": 101, "zone": Zone.HALL_1, "seats": 2, "x": 200, "y": 150, "rotation": 0},
            {"id": 102, "zone": Zone.HALL_1, "seats": 2, "x": 600, "y": 150, "rotation": 0},
            {"id": 103, "zone": Zone.HALL_1, "seats": 4, "x": 200, "y": 350, "rotation": 90},
            {"id": 104, "zone": Zone.HALL_1, "seats": 4, "x": 600, "y": 350, "rotation": 90},
            {"id": 105, "zone": Zone.HALL_1, "seats": 6, "x": 400, "y": 500, "rotation": 0},
            # 2 зал
            {"id": 201, "zone": Zone.HALL_2, "seats": 4, "x": 200, "y": 200, "rotation": 0},
            {"id": 202, "zone": Zone.HALL_2, "seats": 4, "x": 600, "y": 200, "rotation": 0},
            {"id": 203, "zone": Zone.HALL_2, "seats": 8, "x": 400, "y": 300, "rotation": 0},
            {"id": 204, "zone": Zone.HALL_2, "seats": 4, "x": 200, "y": 450, "rotation": 0},
            {"id": 205, "zone": Zone.HALL_2, "seats": 4, "x": 600, "y": 450, "rotation": 0},
            # 3 зал
            {"id": 301, "zone": Zone.HALL_3, "seats": 2, "x": 250, "y": 200, "rotation": 45},
            {"id": 302, "zone": Zone.HALL_3, "seats": 2, "x": 550, "y": 200, "rotation": -45},
            {"id": 303, "zone": Zone.HALL_3, "seats": 4, "x": 400, "y": 400, "rotation": 0},
        ]
        
        for table_data in tables_data:
            table = Table(**table_data, is_active=True)
            db.add(table)
        
        # Сначала сохраняем все таблицы
        await db.flush()
        
        # Create menu categories
        categories_data = [
            {"title": "Салаты", "sort_order": 1},
            {"title": "Супы", "sort_order": 2},
            {"title": "Закуски", "sort_order": 3},
            {"title": "Пицца", "sort_order": 4},
            {"title": "Горячее", "sort_order": 5},
            {"title": "Пиво", "sort_order": 6},
            {"title": "Алкоголь", "sort_order": 7},
            {"title": "Б/А Напитки", "sort_order": 8},
        ]
        
        category_map = {}
        for cat_data in categories_data:
            category = MenuCategory(**cat_data)
            db.add(category)
            await db.flush()  # Получаем ID сразу
            category_map[cat_data["title"]] = category.id
        
        # Create menu items
        menu_items_data = [
            {
                "title": "Салат с печеной тыквой",
                "description": "Тыква мускатная, сыр страчателла, кедровый орех",
                "price": 650,
                "weight": 280,
                "category_title": "Салаты",
                "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
                "is_vegan": True
            },
            {
                "title": "Тартар из оленя",
                "description": "Вырезка оленя, моченая брусника, эмульсия из можжевельника",
                "price": 890,
                "weight": 180,
                "category_title": "Закуски",
                "image_url": "https://images.unsplash.com/photo-1546221523-c495e267b14d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Финская уха",
                "description": "Лосось, судак, сливки, картофель",
                "price": 720,
                "weight": 350,
                "category_title": "Супы",
                "image_url": "https://images.unsplash.com/photo-1547592166-23acbe346499?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Утка конфи",
                "description": "Утиная ножка, пюре из пастернака, вишневый соус",
                "price": 1200,
                "weight": 320,
                "category_title": "Горячее",
                "image_url": "https://images.unsplash.com/photo-1518492104633-130d32220383?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Стейк Мясника",
                "description": "Стейк (диафрагма), перечный соус, печеный картофель",
                "price": 1450,
                "weight": 300,
                "category_title": "Горячее",
                "image_url": "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80",
                "is_spicy": True
            },
            {
                "title": "Пицца с грушей и горгонзолой",
                "description": "Сливочный соус, моцарелла, горгонзола, груша",
                "price": 850,
                "weight": 450,
                "category_title": "Пицца",
                "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Дьявола",
                "description": "Острые колбаски пепперони, перец чили",
                "price": 790,
                "weight": 430,
                "category_title": "Пицца",
                "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
                "is_spicy": True
            },
            {
                "title": "Настойка 'Сеновал'",
                "description": "Водка, мед, сбор трав, цедра лимона",
                "price": 350,
                "weight": 50,
                "category_title": "Алкоголь",
                "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Лагер Фирменный",
                "description": "Светлое пиво",
                "price": 450,
                "weight": 500,
                "category_title": "Пиво",
                "image_url": "https://images.unsplash.com/photo-1618183182103-623259966144?auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Лимонад Малина-Базилик",
                "description": "Малиновое пюре, свежий базилик, содовая",
                "price": 390,
                "weight": 400,
                "category_title": "Б/А Напитки",
                "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
                "is_vegan": True
            },
        ]
        
        for item_data in menu_items_data:
            category_title = item_data.pop("category_title")
            category_id = category_map.get(category_title)
            
            if category_id is None:
                print(f"Warning: Category '{category_title}' not found!")
                continue
            
            item = MenuItem(
                title=item_data["title"],
                description=item_data.get("description", ""),
                price=item_data["price"],
                weight=item_data["weight"],
                image_url=item_data.get("image_url", ""),
                category_id=category_id,
                is_spicy=item_data.get("is_spicy", False),
                is_vegan=item_data.get("is_vegan", False)
            )
            db.add(item)
        
        await db.commit()
        print("✅ Initial data created successfully!")
        print(f"   - {len(tables_data)} tables")
        print(f"   - {len(categories_data)} categories")
        print(f"   - {len(menu_items_data)} menu items")


if __name__ == "__main__":
    asyncio.run(init_data())
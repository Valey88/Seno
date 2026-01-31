#!/usr/bin/env python3
"""
Migration script: SQLite -> PostgreSQL
Migrates users, tables, zones, menu items, and reviews.

Usage:
  1. Make sure Docker containers are running (docker-compose up -d)
  2. Run: python migrate_data.py
"""

import asyncio
import json
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import aiosqlite
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

# Source: SQLite database
SQLITE_DB = "backend/senoval.db"

# Target: PostgreSQL (from docker-compose)
POSTGRES_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://senoval:senoval_secret_password@localhost:5433/senoval"
)


async def migrate():
    print("=" * 60)
    print("SQLite -> PostgreSQL Migration")
    print("=" * 60)
    
    # Check if SQLite file exists
    if not os.path.exists(SQLITE_DB):
        print(f"❌ SQLite database not found: {SQLITE_DB}")
        return
    
    # Connect to PostgreSQL
    print(f"\n📦 Connecting to PostgreSQL...")
    pg_engine = create_async_engine(POSTGRES_URL, echo=False)
    PgSession = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)
    
    # Connect to SQLite
    print(f"📂 Reading from SQLite: {SQLITE_DB}")
    
    async with aiosqlite.connect(SQLITE_DB) as sqlite_db:
        sqlite_db.row_factory = aiosqlite.Row
        
        async with PgSession() as pg_session:
            try:
                # 1. Migrate Users
                print("\n👤 Migrating users...")
                cursor = await sqlite_db.execute("SELECT * FROM users")
                users = await cursor.fetchall()
                
                for user in users:
                    await pg_session.execute(
                        text("""
                            INSERT INTO users (id, username, email, name, password_hash, role, is_verified, yandex_id, oauth_provider)
                            VALUES (:id, :username, :email, :name, :password_hash, :role, :is_verified, :yandex_id, :oauth_provider)
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {
                            "id": user["id"],
                            "username": user["username"],
                            "email": user["email"],
                            "name": user["name"],
                            "password_hash": user["password_hash"],
                            "role": user["role"],
                            "is_verified": bool(user["is_verified"]) if user["is_verified"] is not None else True,
                            "yandex_id": user["yandex_id"] if "yandex_id" in user.keys() else None,
                            "oauth_provider": user["oauth_provider"] if "oauth_provider" in user.keys() else None,
                        }
                    )
                print(f"   ✅ Migrated {len(users)} users")
                
                # Reset sequence
                if users:
                    max_id = max(u["id"] for u in users)
                    await pg_session.execute(text(f"SELECT setval('users_id_seq', {max_id})"))
                
                # 2. Migrate Tables
                print("\n🪑 Migrating tables...")
                cursor = await sqlite_db.execute("SELECT * FROM tables")
                tables = await cursor.fetchall()
                
                for table in tables:
                    await pg_session.execute(
                        text("""
                            INSERT INTO tables (id, table_number, zone, seats, x, y, rotation, is_active)
                            VALUES (:id, :table_number, :zone, :seats, :x, :y, :rotation, :is_active)
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {
                            "id": table["id"],
                            "table_number": table["table_number"] if "table_number" in table.keys() else str(table["id"]),
                            "zone": table["zone"],
                            "seats": table["seats"],
                            "x": table["x"],
                            "y": table["y"],
                            "rotation": table["rotation"] if "rotation" in table.keys() else 0,
                            "is_active": bool(table["is_available"]) if "is_available" in table.keys() and table["is_available"] is not None else True,
                        }
                    )
                print(f"   ✅ Migrated {len(tables)} tables")
                
                if tables:
                    max_id = max(t["id"] for t in tables)
                    await pg_session.execute(text(f"SELECT setval('tables_id_seq', {max_id})"))
                
                # 3. Migrate Menu Categories
                print("\n📋 Migrating menu categories...")
                cursor = await sqlite_db.execute("SELECT * FROM menu_categories")
                categories = await cursor.fetchall()
                
                for cat in categories:
                    await pg_session.execute(
                        text("""
                            INSERT INTO menu_categories (id, title, sort_order)
                            VALUES (:id, :title, :sort_order)
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {
                            "id": cat["id"],
                            "title": cat["title"] if "title" in cat.keys() else cat["name"],
                            "sort_order": cat["sort_order"] if "sort_order" in cat.keys() else 0,
                        }
                    )
                print(f"   ✅ Migrated {len(categories)} categories")
                
                if categories:
                    max_id = max(c["id"] for c in categories)
                    await pg_session.execute(text(f"SELECT setval('menu_categories_id_seq', {max_id})"))
                
                # 4. Migrate Menu Items
                print("\n🍽️  Migrating menu items...")
                cursor = await sqlite_db.execute("SELECT * FROM menu_items")
                items = await cursor.fetchall()
                
                for item in items:
                    await pg_session.execute(
                        text("""
                            INSERT INTO menu_items (id, title, description, price, weight, image_url, category_id, is_spicy, is_vegan)
                            VALUES (:id, :title, :description, :price, :weight, :image_url, :category_id, :is_spicy, :is_vegan)
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {
                            "id": item["id"],
                            "title": item["title"] if "title" in item.keys() else item["name"],  # Map name/title -> title
                            "description": item["description"],
                            "price": item["price"],
                            "weight": item["weight"] if "weight" in item.keys() else 0,  # Ensure weight exists
                            "image_url": item["image_url"],
                            "category_id": item["category_id"],
                            "is_spicy": False, # Default values as they might not exist in SQLite
                            "is_vegan": False,
                        }
                    )
                print(f"   ✅ Migrated {len(items)} menu items")
                
                if items:
                    max_id = max(i["id"] for i in items)
                    await pg_session.execute(text(f"SELECT setval('menu_items_id_seq', {max_id})"))
                
                # 5. Migrate Reviews
                print("\n⭐ Migrating reviews...")
                cursor = await sqlite_db.execute("SELECT * FROM reviews")
                reviews = await cursor.fetchall()
                
                for review in reviews:
                    await pg_session.execute(
                        text("""
                            INSERT INTO reviews (id, author, rating, text, images_json, created_at, is_approved)
                            VALUES (:id, :author, :rating, :text, :images_json, :created_at, :is_approved)
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {
                            "id": review["id"],
                            "author": review["author"],
                            "rating": review["rating"],
                            "text": review["text"],
                            "images_json": review["images_json"],
                            "created_at": datetime.strptime(review["created_at"], "%Y-%m-%d %H:%M:%S") if isinstance(review["created_at"], str) else review["created_at"],
                            "is_approved": bool(review["is_approved"]) if review["is_approved"] is not None else True,
                        }
                    )
                print(f"   ✅ Migrated {len(reviews)} reviews")
                
                if reviews:
                    max_id = max(r["id"] for r in reviews)
                    await pg_session.execute(text(f"SELECT setval('reviews_id_seq', {max_id})"))
                
                # Commit all changes
                await pg_session.commit()
                
                print("\n" + "=" * 60)
                print("✅ Migration completed successfully!")
                print("=" * 60)
                
                # Summary
                print(f"\n📊 Summary:")
                print(f"   Users:      {len(users)}")
                print(f"   Tables:     {len(tables)}")
                print(f"   Categories: {len(categories)}")
                print(f"   Menu Items: {len(items)}")
                print(f"   Reviews:    {len(reviews)}")
                
            except Exception as e:
                print(f"\n❌ Error during migration: {e}")
                await pg_session.rollback()
                raise
            finally:
                await pg_engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())

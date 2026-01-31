"""
Migration script to add OAuth fields to users table.
Run this script to add yandex_id and oauth_provider columns.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine


async def migrate():
    """Add OAuth fields to users table."""
    async with engine.begin() as conn:
        # Check if columns exist
        result = await conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        
        if "yandex_id" not in columns:
            print("Adding yandex_id column...")
            # SQLite doesn't support adding UNIQUE constraint via ALTER TABLE
            # So we add column first, then create a unique index
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN yandex_id VARCHAR"
            ))
            print("✓ yandex_id column added")
            
            # Create unique index for yandex_id
            try:
                await conn.execute(text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_yandex_id ON users(yandex_id)"
                ))
                print("✓ yandex_id unique index created")
            except Exception as e:
                print(f"⚠ Could not create unique index (may already exist): {e}")
        else:
            print("✓ yandex_id column already exists")
        
        if "oauth_provider" not in columns:
            print("Adding oauth_provider column...")
            await conn.execute(text(
                "ALTER TABLE users ADD COLUMN oauth_provider VARCHAR"
            ))
            print("✓ oauth_provider column added")
        else:
            print("✓ oauth_provider column already exists")
        
        # Make password_hash nullable (SQLite doesn't support ALTER COLUMN, so we skip this)
        # For new users created via OAuth, password_hash will be NULL
        
        print("\n✅ Migration completed successfully!")
        print("\nDon't forget to add Yandex OAuth credentials to .env:")
        print("YANDEX_CLIENT_ID=your_client_id")
        print("YANDEX_CLIENT_SECRET=your_client_secret")


if __name__ == "__main__":
    asyncio.run(migrate())

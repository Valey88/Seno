"""
Migration script to add user_id column to bookings table.
Run this script once to update the database schema.
"""
import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Import database URL from app settings
sys.path.insert(0, ".")
from app.database import settings


async def migrate():
    """Add user_id column to bookings table."""
    engine = create_async_engine(settings.database_url, echo=True)
    
    async with engine.begin() as conn:
        # Check if column already exists (PostgreSQL)
        if "postgresql" in settings.database_url:
            result = await conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'bookings' AND column_name = 'user_id'
            """))
            exists = result.fetchone() is not None
        else:
            # SQLite: Check via PRAGMA
            result = await conn.execute(text("PRAGMA table_info(bookings)"))
            columns = [row[1] for row in result.fetchall()]
            exists = "user_id" in columns
        
        if exists:
            print("✓ Column 'user_id' already exists in 'bookings' table.")
            return
        
        # Add the column
        print("Adding 'user_id' column to 'bookings' table...")
        
        if "postgresql" in settings.database_url:
            await conn.execute(text("""
                ALTER TABLE bookings 
                ADD COLUMN user_id INTEGER REFERENCES users(id)
            """))
            # Create index
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_bookings_user_id ON bookings(user_id)
            """))
        else:
            # SQLite
            await conn.execute(text("""
                ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id)
            """))
            # SQLite doesn't support adding index in same transaction easily
            # Index will be created on next app start via SQLAlchemy
        
        print("✓ Migration completed successfully!")
        print("  - Added 'user_id' column to 'bookings' table")
        print("  - Column is nullable to support existing bookings")


if __name__ == "__main__":
    print("=" * 50)
    print("Migration: Add user_id to bookings")
    print("=" * 50)
    asyncio.run(migrate())

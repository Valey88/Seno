"""
Script to create the first admin user.
Run: python create_admin.py
"""
import asyncio
from app.database import AsyncSessionLocal, init_db
from app.models import User, UserRole
from app.auth import get_password_hash


async def create_admin():
    """Create default admin user."""
    from app.database import settings
    print(f"DEBUG: Using DATABASE_URL={settings.database_url.split('@')[-1]}")
    print("DEBUG: Starting init_db()...")
    try:
        await init_db()
        print("DEBUG: init_db() completed.")
    except Exception as e:
        print(f"DEBUG: init_db() failed: {e}")
        raise e
    
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.username == "admin"))
        existing = result.scalar_one_or_none()
        
        if existing:
            print("Admin user already exists!")
            return
        
        # Create admin
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("\n⚠️  Please change the password after first login!")


if __name__ == "__main__":
    asyncio.run(create_admin())


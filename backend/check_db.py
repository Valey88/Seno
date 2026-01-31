import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Get URL from environment
url = os.getenv("DATABASE_URL")

print("--- Database Connection Test ---")
if not url:
    print("❌ Error: DATABASE_URL environment variable is not set.")
    print("Usage: export DATABASE_URL='...' && python check_db.py")
    sys.exit(1)

print(f"Target Host: {url.split('@')[-1].split('?')[0]}") # Show host, hide credentials

async def test_connection():
    print("⏳ Creating engine...")
    try:
        engine = create_async_engine(url, echo=True)
        
        print("⏳ Connecting to database...")
        async with engine.connect() as conn:
            print("✅ Connection established!")
            
            print("⏳ Executing test query (SELECT 1)...")
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ Query successful! Result: {result.scalar()}")
            
    except Exception as e:
        print(f"\n❌ Connection Failed!")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        return False
    return True

if __name__ == "__main__":
    try:
        asyncio.run(test_connection())
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user.")

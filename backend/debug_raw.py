import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Force DEBUG output
os.environ["DEBUG"] = "true"
from app.database import settings

async def debug_raw():
    url = settings.database_url
    print(f"DEBUG RAW: URL host: {url.split('@')[-1]}")
    
    engine = create_async_engine(url, echo=True)

    print("DEBUG RAW: Accessing connection...")
    try:
        async with engine.begin() as conn:
            print("DEBUG RAW: Connection acquired. Creating dummy table...")
            await conn.execute(text("CREATE TABLE IF NOT EXISTS test_debug (id serial PRIMARY KEY, val text)"))
            print("DEBUG RAW: Table created. Inserting data...")
            await conn.execute(text("INSERT INTO test_debug (val) VALUES ('test')"))
            print("DEBUG RAW: Data inserted.")
    except Exception as e:
        print(f"DEBUG RAW: Error: {e}")
        import traceback
        traceback.print_exc()
    print("DEBUG RAW: Done.")

if __name__ == "__main__":
    if "neondb" not in settings.database_url:
        print("❌ WARNING: It looks like you are not using the Neon URL.")
    
    try:
        asyncio.run(debug_raw())
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted.")

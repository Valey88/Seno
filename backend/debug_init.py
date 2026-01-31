import asyncio
import os
import sys

# Force DEBUG output
os.environ["DEBUG"] = "true"

from app.database import engine, Base, settings

async def debug_init():
    print(f"DEBUG SCRIPT: URL host: {settings.database_url.split('@')[-1]}")
    
    # Import models
    import app.models
    print("DEBUG SCRIPT: Models imported")

    print("DEBUG SCRIPT: Starting engine.begin()...")
    try:
        async with engine.begin() as conn:
            print("DEBUG SCRIPT: Connection acquired. Running create_all...")
            await conn.run_sync(Base.metadata.create_all)
            print("DEBUG SCRIPT: create_all finished.")
    except Exception as e:
        print(f"DEBUG SCRIPT: Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if "neondb" not in settings.database_url:
        print("❌ WARNING: It looks like you are not using the Neon URL.")
        print(f"Current URL: {settings.database_url}")
    
    try:
        asyncio.run(debug_init())
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted.")

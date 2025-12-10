"""
Migration script to add email, name, and is_verified fields to users table.
Run this script once to update your existing database.
"""
import sqlite3
from pathlib import Path
import os

def migrate_database():
    """Add missing columns to users table."""
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    db_path = Path("senoval.db")
    
    if not db_path.exists():
        print("Database file not found. It will be created on next server start.")
        return
    
    print(f"Connecting to database: {db_path.absolute()}...")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print(f"Existing columns: {column_names}")
        
        # Add email column if it doesn't exist
        if 'email' not in column_names:
            print("Adding 'email' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
            print("✓ Added 'email' column")
        else:
            print("✓ 'email' column already exists")
        
        # Add name column if it doesn't exist
        if 'name' not in column_names:
            print("Adding 'name' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN name VARCHAR")
            print("✓ Added 'name' column")
        else:
            print("✓ 'name' column already exists")
        
        # Add is_verified column if it doesn't exist
        if 'is_verified' not in column_names:
            print("Adding 'is_verified' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            print("✓ Added 'is_verified' column")
        else:
            print("✓ 'is_verified' column already exists")
        
        # Check if email_verification_codes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='email_verification_codes'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("Creating 'email_verification_codes' table...")
            cursor.execute("""
                CREATE TABLE email_verification_codes (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR NOT NULL,
                    code VARCHAR NOT NULL,
                    expires_at DATETIME NOT NULL,
                    is_used BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX ix_email_verification_codes_email ON email_verification_codes (email)")
            print("✓ Created 'email_verification_codes' table")
        else:
            print("✓ 'email_verification_codes' table already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("You can now restart the server.")
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()


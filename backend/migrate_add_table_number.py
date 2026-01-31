"""
Direct SQL migration to add table_number column to tables table.
This script uses SQLite directly since alembic is not configured.
"""
import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), 'senoval.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting migration...")
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(tables)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'table_number' in columns:
            print("✓ table_number column already exists, skipping migration")
            return
        
        # Add table_number column
        print("Adding table_number column...")
        cursor.execute("ALTER TABLE tables ADD COLUMN table_number TEXT")
        
        # Backfill existing tables with table_number based on ID
        print("Backfilling table numbers...")
        cursor.execute("UPDATE tables SET table_number = CAST(id AS TEXT)")
        
        # Create index
        print("Creating index...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_tables_table_number ON tables(table_number)")
        
        conn.commit()
        print("✓ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

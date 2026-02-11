#!/usr/bin/env python3
"""
Database migration script for Gmail integration.
Run this to add new columns to existing leads table.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data.db"

def migrate():
    """Add new email tracking columns to leads table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(leads)")
        columns = [col[1] for col in cursor.fetchall()]

        # Add gmail_message_id if not exists
        if 'gmail_message_id' not in columns:
            cursor.execute("ALTER TABLE leads ADD COLUMN gmail_message_id TEXT")
            print("✓ Added gmail_message_id column")

        # Add gmail_thread_id if not exists
        if 'gmail_thread_id' not in columns:
            cursor.execute("ALTER TABLE leads ADD COLUMN gmail_thread_id TEXT")
            print("✓ Added gmail_thread_id column")

        # Add email_sent_at if not exists
        if 'email_sent_at' not in columns:
            cursor.execute("ALTER TABLE leads ADD COLUMN email_sent_at TIMESTAMP")
            print("✓ Added email_sent_at column")

        # Add email_status if not exists
        if 'email_status' not in columns:
            cursor.execute("ALTER TABLE leads ADD COLUMN email_status TEXT DEFAULT 'pending'")
            print("✓ Added email_status column")

        # Create gmail_settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gmail_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gmail_address TEXT NOT NULL UNIQUE,
                access_token TEXT,
                refresh_token TEXT,
                token_expiry TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created gmail_settings table")

        conn.commit()
        print("\n✅ Migration completed successfully!")

    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running Gmail integration migration...")
    migrate()

import sqlite3
import os
import contextlib

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "agentmesh.db")

def init_db():
    """
    Initializes the database and creates the schema if it doesn't exist.
    Persists DB in the /data directory to be mounted as a volume.
    """
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
        
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                url TEXT,
                version TEXT,
                capabilities TEXT,
                raw_agent_card TEXT,
                status TEXT,
                latency_ms INTEGER,
                last_seen TEXT,
                approved INTEGER NOT NULL DEFAULT 0,
                deregistered INTEGER NOT NULL DEFAULT 0,
                domain TEXT,
                company TEXT
            )
        ''')

        # Ensure older databases are migrated to include approval and deregistration state.
        cursor.execute("PRAGMA table_info(agents)")
        columns = [row[1] for row in cursor.fetchall()]
        if "approved" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN approved INTEGER NOT NULL DEFAULT 0")
        if "deregistered" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN deregistered INTEGER NOT NULL DEFAULT 0")
        if "domain" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN domain TEXT")
        if "company" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN company TEXT")

        conn.commit()

@contextlib.contextmanager
def get_db_connection():
    """Context manager for deterministic database connections."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

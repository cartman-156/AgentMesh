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
                last_seen TEXT
            )
        ''')
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

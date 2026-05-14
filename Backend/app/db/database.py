import sqlite3
import os
import contextlib
import sys
from typing import List, Optional, Dict, Any

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "agentmesh.db")

EXPECTED_COLUMNS = {
    "id",
    "description",
    "json_data",
    "approval_status",
    "health",
    "latency_ms",
    "last_checked"
}


def panic(message: str):
    print(f"[PANIC] {message}")
    sys.exit(1)


# -----------------------------
# INIT DB (STRICT MODE)
# -----------------------------
def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            AND name='agents'
        """)

        exists = cursor.fetchone() is not None

        if not exists:
            cursor.execute("""
                CREATE TABLE agents (
                    id TEXT PRIMARY KEY,
                    description TEXT,
                    json_data TEXT NOT NULL,
                    approval_status TEXT NOT NULL DEFAULT 'pending',
                    health TEXT,
                    latency_ms INTEGER,
                    last_checked TEXT
                )
            """)
            conn.commit()
            return

        # STRICT schema validation
        cursor.execute("PRAGMA table_info(agents)")
        actual_columns = {row[1] for row in cursor.fetchall()}

        if actual_columns != EXPECTED_COLUMNS:
            panic(f"""
SCHEMA MISMATCH DETECTED

Expected:
{sorted(EXPECTED_COLUMNS)}

Actual:
{sorted(actual_columns)}

Fix required: delete DB or recreate schema manually.
""".strip())


# -----------------------------
# CONNECTION
# -----------------------------
@contextlib.contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


# -----------------------------
# READ OPERATIONS (RAW ONLY)
# -----------------------------
def get_all_agents_raw() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents ORDER BY id ASC")
        return [dict(row) for row in cursor.fetchall()]


def get_agent_by_id(agent_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


# -----------------------------
# WRITE OPERATIONS
# -----------------------------
def upsert_agent_raw(
    agent_id: str,
    description: str,
    json_data: str,
    approval_status: str = "pending",
    health: Optional[str] = None,
    latency_ms: Optional[int] = None,
    last_checked: Optional[str] = None
):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO agents (
                id,
                description,
                json_data,
                approval_status,
                health,
                latency_ms,
                last_checked
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                description=excluded.description,
                json_data=excluded.json_data,
                approval_status=excluded.approval_status,
                health=excluded.health,
                latency_ms=excluded.latency_ms,
                last_checked=excluded.last_checked
        """, (
            agent_id,
            description,
            json_data,
            approval_status,
            health,
            latency_ms,
            last_checked
        ))
        conn.commit()


def update_agent_fields(agent_id: str, **fields):
    if not fields:
        return

    keys = list(fields.keys())
    values = list(fields.values())

    set_clause = ", ".join([f"{k} = ?" for k in keys])

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE agents SET {set_clause} WHERE id = ?",
            values + [agent_id]
        )
        conn.commit()


def set_agent_status(agent_id: str, status: str):
    update_agent_fields(agent_id, approval_status=status)


def set_agent_health(
    agent_id: str,
    health: str,
    latency_ms: Optional[int] = None,
    last_checked: Optional[str] = None
):
    update_agent_fields(
        agent_id,
        health=health,
        latency_ms=latency_ms,
        last_checked=last_checked
    )


def delete_agent(agent_id: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
        conn.commit()


def agent_exists(agent_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM agents WHERE id = ?", (agent_id,))
        return cursor.fetchone() is not None


def get_agents_by_status_raw(status: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM agents WHERE approval_status = ? ORDER BY id ASC",
            (status,)
        )
        return [dict(row) for row in cursor.fetchall()]
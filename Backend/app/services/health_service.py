import json
import requests
import time
from typing import Optional, Dict, Any
from datetime import datetime
from app.db.database import get_db_connection


def check_agent_health(agent_id: str, agent_url: str) -> Dict[str, Any]:
    """
    Check the health of a single agent.
    
    Parameters:
    - agent_id: Agent identifier
    - agent_url: Agent URL
    
    Returns: { status, latency_ms, last_checked }
    """
    start_time = time.time()
    status = "unhealthy"
    latency_ms = None
    
    try:
        # Try to fetch from health endpoint
        health_url = f"{agent_url.rstrip('/')}/.well-known/health"
        response = requests.get(health_url, timeout=5)
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            status = "healthy"
        else:
            status = "unhealthy"
    except Exception:
        # If health endpoint fails, agent is unhealthy
        latency_ms = int((time.time() - start_time) * 1000)
        status = "unhealthy"
    
    return {
        "status": status,
        "latency_ms": latency_ms,
        "last_checked": datetime.utcnow().isoformat()
    }


def update_agent_health_status(
    agent_id: str,
    status: str,
    latency_ms: int,
    last_checked: str
) -> None:
    """
    Update agent health status in database.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE agents SET
                status = ?,
                latency_ms = ?,
                last_seen = ?
            WHERE id = ?
        ''', (status, latency_ms, last_checked, agent_id))
        conn.commit()


def get_agent_health(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Get health information for a specific agent.
    
    Returns: { status, latency_ms, last_checked }
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT status, latency_ms, last_seen FROM agents WHERE id = ?",
            (agent_id,)
        )
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "status": row[0],
            "latency_ms": row[1],
            "last_checked": row[2]
        }


def get_system_health() -> Dict[str, Any]:
    """
    Get system-wide health metrics.
    
    Returns: { agents_total, healthy, unhealthy, avg_latency_ms }
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status, latency_ms FROM agents")
        rows = cursor.fetchall()
    
    agents_total = len(rows)
    healthy = sum(1 for row in rows if row[0] == "healthy")
    unhealthy = agents_total - healthy
    
    # Calculate average latency (excluding None values)
    latencies = [row[1] for row in rows if row[1] is not None]
    avg_latency_ms = int(sum(latencies) / len(latencies)) if latencies else 0
    
    return {
        "agents_total": agents_total,
        "healthy": healthy,
        "unhealthy": unhealthy,
        "avg_latency_ms": avg_latency_ms
    }

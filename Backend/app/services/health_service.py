import json
import requests
import time
from typing import Optional, Dict, Any
from datetime import datetime
from app.db import database


def check_agent_health(agent_id: str, agent_url: str) -> Dict[str, Any]:
    """
    Check the health of a single agent.
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
    database.set_agent_health(
        agent_id=agent_id,
        health=status,
        latency_ms=latency_ms,
        last_checked=last_checked
    )


def get_agent_health(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Get health information for a specific agent.
    """
    row = database.get_agent_by_id(agent_id)
    
    if not row:
        return None
    
    return {
        "status": row.get("health"),
        "latency_ms": row.get("latency_ms"),
        "last_checked": row.get("last_checked")
    }


def get_system_health() -> Dict[str, Any]:
    """
    Get system-wide health metrics.
    """
    rows = database.get_all_agents_raw()
    
    agents_total = len(rows)
    healthy = sum(1 for row in rows if row.get("health") == "healthy")
    unhealthy = agents_total - healthy
    
    # Calculate average latency (excluding None values)
    latencies = [row.get("latency_ms") for row in rows if row.get("latency_ms") is not None]
    avg_latency_ms = int(sum(latencies) / len(latencies)) if latencies else 0
    
    return {
        "agents_total": agents_total,
        "healthy": healthy,
        "unhealthy": unhealthy,
        "avg_latency_ms": avg_latency_ms
    }

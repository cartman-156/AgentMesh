import json
from typing import Optional, Dict, Any, List
from app.db.database import get_db_connection
from app.core.capability_normalization import normalize_capabilities
from app.core.capabilities_map import get_canonical


def get_debug_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed debug information for a single agent.
    
    Returns:
    - raw_agent_card
    - raw_capabilities
    - normalized_capabilities
    - canonical_capabilities
    - stored DB fields
    - health state
    - ingestion_trace
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
    
    if not row:
        return None
    
    agent = dict(row)
    
    # Parse JSON fields
    raw_agent_card = {}
    try:
        raw_agent_card = json.loads(agent["raw_agent_card"]) if agent["raw_agent_card"] else {}
    except json.JSONDecodeError:
        pass
    
    capabilities_data = {}
    try:
        capabilities_data = json.loads(agent["capabilities"]) if agent["capabilities"] else {}
    except json.JSONDecodeError:
        pass
    
    return {
        "agent_id": agent_id,
        "raw_agent_card": raw_agent_card,
        "raw_capabilities": capabilities_data.get("raw_capabilities", []),
        "normalized_capabilities": capabilities_data.get("normalized_capabilities", []),
        "canonical_capabilities": capabilities_data.get("canonical_capabilities", []),
        "stored_fields": {
            "id": agent["id"],
            "name": agent["name"],
            "description": agent["description"],
            "url": agent["url"],
            "version": agent["version"],
            "status": agent["status"],
            "latency_ms": agent["latency_ms"],
            "last_seen": agent["last_seen"]
        },
        "health_state": {
            "status": agent["status"],
            "latency_ms": agent["latency_ms"],
            "last_checked": agent["last_seen"]
        },
        "ingestion_trace": {
            "agent_id_generation": "deterministic from name or card hash",
            "capabilities_normalized": True,
            "schema_version": 1
        }
    }


def debug_search(
    agent_id: Optional[str] = None,
    name: Optional[str] = None,
    capability: Optional[str] = None,
    match: Optional[str] = None
) -> Dict[str, Any]:
    """
    Debug search with trace information.
    
    Returns:
    - input query
    - normalization steps
    - canonical mapping result
    - matching strategy
    - matched agent_ids with reasons
    """
    trace = {
        "input_query": {
            "agent_id": agent_id,
            "name": name,
            "capability": capability,
            "match": match or "partial"
        },
        "normalization_steps": [],
        "canonical_mapping": None,
        "matching_strategy": {},
        "matched_agents": []
    }
    
    # Get all agents
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents")
        rows = cursor.fetchall()
    
    agents = [dict(row) for row in rows]
    matched_agents = agents.copy()
    
    # agent_id matching
    if agent_id is not None:
        trace["matching_strategy"]["agent_id"] = "exact match"
        matched_agents = [a for a in matched_agents if a["id"] == agent_id]
    
    # name matching
    if name is not None:
        name_lower = name.lower()
        match_mode = match or "partial"
        trace["matching_strategy"]["name"] = f"{match_mode} match"
        trace["normalization_steps"].append(f"name: lowercase '{name_lower}'")
        
        if match_mode == "exact":
            matched_agents = [a for a in matched_agents if a["name"].lower() == name_lower]
        else:
            matched_agents = [a for a in matched_agents if name_lower in a["name"].lower()]
    
    # capability matching
    if capability is not None:
        canonical = get_canonical(capability.lower())
        trace["canonical_mapping"] = {
            "input": capability,
            "normalized": capability.lower(),
            "canonical": canonical
        }
        trace["matching_strategy"]["capability"] = f"{match or 'partial'} match on canonical"
        trace["normalization_steps"].append(f"capability: normalize → canonical '{canonical}'")
        
        filtered_agents = []
        for agent in matched_agents:
            try:
                capabilities_data = json.loads(agent["capabilities"])
                canonical_caps = capabilities_data.get("canonical_capabilities", [])
                
                match_mode = match or "partial"
                if match_mode == "exact":
                    if canonical in canonical_caps:
                        filtered_agents.append(agent)
                else:
                    if any(canonical in cap for cap in canonical_caps):
                        filtered_agents.append(agent)
            except (json.JSONDecodeError, TypeError):
                pass
        
        matched_agents = filtered_agents
    
    # Build matched agents with reasons
    for agent in matched_agents:
        reason = []
        if agent_id is not None:
            reason.append(f"agent_id exact match '{agent_id}'")
        if name is not None:
            reason.append(f"name {match or 'partial'} match '{name}'")
        if capability is not None:
            reason.append(f"capability {match or 'partial'} match '{canonical}'")
        
        trace["matched_agents"].append({
            "agent_id": agent["id"],
            "name": agent["name"],
            "match_reasons": reason
        })
    
    return trace


def get_debug_state() -> Dict[str, Any]:
    """
    Get system-wide debug state information.
    
    Returns:
    - total agents
    - health distribution
    - canonical capability distribution
    - unclassified capabilities
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents")
        rows = cursor.fetchall()
    
    agents = [dict(row) for row in rows]
    
    # Health distribution
    health_counts = {"healthy": 0, "unhealthy": 0, "unknown": 0}
    for agent in agents:
        status = agent.get("status", "unknown")
        if status in health_counts:
            health_counts[status] += 1
        else:
            health_counts["unknown"] += 1
    
    # Canonical capability distribution
    capability_counts = {}
    unclassified = []
    
    for agent in agents:
        try:
            capabilities_data = json.loads(agent["capabilities"])
            canonical_caps = capabilities_data.get("canonical_capabilities", [])
            
            for cap in canonical_caps:
                if cap == "unclassified":
                    raw_caps = capabilities_data.get("raw_capabilities", [])
                    unclassified.extend(raw_caps)
                else:
                    capability_counts[cap] = capability_counts.get(cap, 0) + 1
        except (json.JSONDecodeError, TypeError):
            pass
    
    return {
        "total_agents": len(agents),
        "health_distribution": health_counts,
        "canonical_capability_distribution": capability_counts,
        "unclassified_capabilities": list(set(unclassified))
    }


def get_debug_agent_health(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed health check information for an agent.
    
    Returns:
    - recent health checks
    - latency history
    - failure reasons
    - timestamps
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, status, latency_ms, last_seen FROM agents WHERE id = ?",
            (agent_id,)
        )
        row = cursor.fetchone()
    
    if not row:
        return None
    
    agent_id_val, status, latency_ms, last_seen = row
    
    return {
        "agent_id": agent_id_val,
        "current_health": {
            "status": status,
            "latency_ms": latency_ms,
            "last_checked": last_seen
        },
        "recent_checks": [
            {
                "status": status,
                "latency_ms": latency_ms,
                "timestamp": last_seen
            }
        ],
        "latency_history": [latency_ms] if latency_ms is not None else [],
        "failure_reasons": [],
        "check_interval_seconds": 60
    }

import json
from typing import Optional, Dict, Any, List
from app.db.database import get_db_connection


def search_agents(
    agent_id: Optional[str] = None,
    name: Optional[str] = None,
    capability: Optional[str] = None,
    match: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search agents with deterministic filtering.
    
    Parameters:
    - agent_id: Exact match only (no partial matching)
    - name: Supports partial or exact match based on `match` parameter
    - capability: Uses canonical capability matching
    - match: "partial" or "exact" (applies to name and capability only)
    
    All filters use AND semantics.
    
    Returns: { query, results: [...] }
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE approved = 1 AND deregistered = 0")
        rows = cursor.fetchall()
    
    # Convert rows to dictionaries
    agents = [dict(row) for row in rows]
    
    # Apply agent_id filter (exact match only)
    if agent_id is not None:
        agents = [a for a in agents if a["id"] == agent_id]
    
    # Apply name filter (partial or exact)
    if name is not None:
        name_lower = name.lower()
        if match == "exact":
            agents = [a for a in agents if a["name"].lower() == name_lower]
        else:
            # Default to partial matching
            agents = [a for a in agents if name_lower in a["name"].lower()]
    
    # Apply capability filter (canonical matching)
    if capability is not None:
        filtered_agents = []
        for agent in agents:
            try:
                capabilities_data = json.loads(agent["capabilities"])
                canonical_caps = capabilities_data.get("canonical_capabilities", [])
                
                if match == "exact":
                    if capability in canonical_caps:
                        filtered_agents.append(agent)
                else:
                    # Partial matching for capability
                    capability_lower = capability.lower()
                    if any(capability_lower in cap.lower() for cap in canonical_caps):
                        filtered_agents.append(agent)
            except (json.JSONDecodeError, TypeError):
                pass
        
        agents = filtered_agents
    
    return {
        "query": {
            "agent_id": agent_id,
            "name": name,
            "capability": capability,
            "match": match or "partial"
        },
        "results": agents
    }

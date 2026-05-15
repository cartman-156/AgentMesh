import json
from typing import Optional, Dict, Any, List
from app.db import database


def search_agents(
    agent_id: Optional[str] = None,
    name: Optional[str] = None,
    capability: Optional[str] = None,
    description: Optional[str] = None,
    skills: Optional[str] = None,
    only_approved: bool = False,
    match: Optional[str] = "partial"
) -> Dict[str, Any]:
    """
    Search agents with deterministic filtering.
    """
    rows = database.get_all_agents_raw()
    
    # Convert rows to dictionaries and handle basic mapping
    agents = []
    for row in rows:
        agent = dict(row)
        # Handle JSON parsing for capabilities/data
        try:
            if "json_data" in agent and isinstance(agent["json_data"], str):
                agent["json_data"] = json.loads(agent["json_data"])
        except (json.JSONDecodeError, TypeError):
            pass
            
        agents.append(agent)
    
    # Apply only_approved filter
    if only_approved:
        agents = [a for a in agents if a.get("approval_status") == "approved"]

    # Apply agent_id filter (exact match only)
    if agent_id is not None:
        agents = [a for a in agents if a["id"] == agent_id]
    
    # Apply name filter
    if name is not None:
        name_lower = name.lower()
        if match == "exact":
            agents = [
                a for a in agents 
                if name_lower == (a.get("json_data") or {}).get("name", "").lower() or name_lower == a.get("name", "").lower()
            ]
        else:
            agents = [
                a for a in agents 
                if name_lower in (a.get("json_data") or {}).get("name", "").lower() or name_lower in a.get("name", "").lower()
            ]
        
    # Apply description filter
    if description is not None:
        desc_lower = description.lower()
        if match == "exact":
            agents = [
                a for a in agents 
                if desc_lower == (a.get("json_data") or {}).get("description", "").lower() or desc_lower in a.get("description", "").lower()
            ]
        else:
            agents = [
                a for a in agents 
                if desc_lower in (a.get("json_data") or {}).get("description", "").lower() or desc_lower in a.get("description", "").lower()
            ]
    
    # Apply skills filter
    if skills is not None:
        skills_lower = skills.lower()
        matched_agents = []
        for agent in agents:
            agent_skills = (agent.get("json_data") or {}).get("skills", [])
            # Skills can be strings or objects with a name property
            found = False
            for s in agent_skills:
                skill_text = s.get("name", "") if isinstance(s, dict) else str(s)
                if skills_lower in skill_text.lower():
                    found = True
                    break
            if found:
                matched_agents.append(agent)
        agents = matched_agents

    # Apply capability filter
    if capability is not None:
        capability_lower = capability.lower()
        matched_agents = []
        for agent in agents:
            caps_data = (agent.get("json_data") or {}).get("capabilities", {})
            
            # Extract lists for checking
            canonical = caps_data.get("canonical_capabilities", [])
            normalized = caps_data.get("normalized_capabilities", [])
            raw = caps_data.get("raw_capabilities", [])
            
            # If raw is a dict (boolean flags), convert to list of keys
            if isinstance(raw, dict):
                raw = [k for k, v in raw.items() if v is True]
            
            # Check all three tiers
            found = False
            for c in canonical + normalized + raw:
                if capability_lower in str(c).lower():
                    found = True
                    break
            
            if found:
                matched_agents.append(agent)
        agents = matched_agents
    
    # Finalize results for UI
    for agent in agents:
        data = agent.get("json_data") or {}
        caps = data.get("capabilities", {})
        
        # Handle legacy structured format
        if isinstance(caps, dict) and "raw_capabilities" in caps:
            caps = caps["raw_capabilities"]
            if not isinstance(caps, dict):
                caps = {c: True for c in (caps if isinstance(caps, list) else [])}

        # Return stringified for frontend
        agent["capabilities"] = json.dumps(caps)
        agent["skills"] = json.dumps(data.get("skills", []))
        agent["raw_agent_card"] = json.dumps(data.get("raw_agent_card", data))
        
        # Ensure top-level fields are populated from json_data if missing
        if not agent.get("name") and data.get("name"):
            agent["name"] = data["name"]
        if not agent.get("description") and data.get("description"):
            agent["description"] = data["description"]
        if not agent.get("url") and data.get("url"):
            agent["url"] = data["url"]

        # Map flags and health (consistent with agent_service.py)
        agent["approved"] = 1 if agent.get("approval_status") == "approved" else 0
        agent["deregistered"] = 1 if agent.get("approval_status") == "deregistered" else 0
        agent["status"] = agent.get("health", "unknown")
        agent["last_seen"] = agent.get("last_checked")

    return {
        "query": {
            "agent_id": agent_id,
            "name": name,
            "capability": capability,
            "description": description,
            "skills": skills,
            "only_approved": only_approved,
            "match": match or "partial"
        },
        "results": agents
    }

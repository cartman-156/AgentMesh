import json
from typing import Optional, Dict, Any, List

from app.db import database


# -----------------------------
# SAFE JSON PARSER
# -----------------------------
def _safe_json_load(value):
    if not value:
        return {}
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except Exception:
        return {}


# -----------------------------
# GET SINGLE AGENT DEBUG
# -----------------------------
def get_debug_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    row = database.get_agent_by_id(agent_id)

    if not row:
        return None

    payload = _safe_json_load(row.get("json_data"))

    return {
        "agent_id": agent_id,

        # full raw stored payload
        "raw_agent_data": payload,

        "stored_fields": {
            "id": row.get("id"),
            "description": row.get("description"),
            "approval_status": row.get("approval_status"),
        },

        "health_state": {
            "health": row.get("health"),
            "latency_ms": row.get("latency_ms"),
            "last_checked": row.get("last_checked"),
        },

        "ingestion_trace": {
            "json_storage": True,
            "schema_version": 2
        }
    }


# -----------------------------
# DEBUG SEARCH
# -----------------------------
def debug_search(
    agent_id: Optional[str] = None,
    name: Optional[str] = None,
    capability: Optional[str] = None,
    description: Optional[str] = None,
    skills: Optional[str] = None,
    only_approved: bool = False,
    match: Optional[str] = None
) -> Dict[str, Any]:

    trace = {
        "input_query": {
            "agent_id": agent_id,
            "name": name,
            "capability": capability,
            "description": description,
            "skills": skills,
            "only_approved": only_approved,
            "match": match
        },
        "matching_strategy": {},
        "matched_agents": []
    }

    rows = database.get_all_agents_raw()
    agents = []
    for row in rows:
        agent = dict(row)
        try:
            if "json_data" in agent and isinstance(agent["json_data"], str):
                agent["json_data"] = json.loads(agent["json_data"])
        except:
            pass
        agents.append(agent)
    
    matched = agents

    # -------------------------
    # Only Approved filter
    # -------------------------
    if only_approved:
        trace["matching_strategy"]["only_approved"] = "restrict to approved"
        matched = [a for a in matched if a.get("approval_status") == "approved"]

    # -------------------------
    # ID filter
    # -------------------------
    if agent_id:
        trace["matching_strategy"]["agent_id"] = "exact match"
        matched = [a for a in matched if a.get("id") == agent_id]

    # -------------------------
    # Name filter
    # -------------------------
    if name:
        trace["matching_strategy"]["name"] = f"{match or 'partial'} match"
        name_lower = name.lower()
        matched = [
            a for a in matched 
            if name_lower in (a.get("json_data") or {}).get("name", "").lower() or name_lower in a.get("name", "").lower()
        ]

    # -------------------------
    # Description filter
    # -------------------------
    if description:
        trace["matching_strategy"]["description"] = "partial match"
        desc_lower = description.lower()
        matched = [
            a for a in matched 
            if desc_lower in (a.get("json_data") or {}).get("description", "").lower() or desc_lower in a.get("description", "").lower()
        ]

    # -------------------------
    # Skills filter
    # -------------------------
    if skills:
        trace["matching_strategy"]["skills"] = "partial match"
        skills_lower = skills.lower()
        matched_agents = []
        for agent in matched:
            agent_skills = (agent.get("json_data") or {}).get("skills", [])
            found = False
            for s in agent_skills:
                skill_text = s.get("name", "") if isinstance(s, dict) else str(s)
                if skills_lower in skill_text.lower():
                    found = True
                    break
            if found:
                matched_agents.append(agent)
        matched = matched_agents

    # -------------------------
    # Capability filter
    # -------------------------
    if capability:
        trace["matching_strategy"]["capability"] = f"{match or 'partial'} match"
        capability_lower = capability.lower()
        matched_agents = []
        for agent in matched:
            caps = (agent.get("json_data") or {}).get("capabilities", {})
            if isinstance(caps, dict) and "raw_capabilities" in caps:
                caps = caps["raw_capabilities"]
                if not isinstance(caps, dict):
                    caps = {c: True for c in (caps if isinstance(caps, list) else [])}
            
            if isinstance(caps, dict):
                for cap_name, enabled in caps.items():
                    if enabled is True and capability_lower in cap_name.lower():
                        matched_agents.append(agent)
                        break
        matched = matched_agents

    # -------------------------
    # Build response
    # -------------------------
    for a in matched:
        trace["matched_agents"].append({
            "agent_id": a.get("id"),
            "description": a.get("description"),
            "approval_status": a.get("approval_status"),
            "match_reasons": [
                *(["agent_id match"] if agent_id else []),
                *(["name match"] if name else []),
                *(["description match"] if description else []),
                *(["skills match"] if skills else []),
                *(["capability match"] if capability else []),
                *(["approval status requirement met"] if only_approved else [])
            ]
        })

    return trace


# -----------------------------
# SYSTEM STATE
# -----------------------------
def get_debug_state() -> Dict[str, Any]:
    rows = database.get_all_agents_raw()
    agents = [dict(r) for r in rows]

    health_counts = {
        "healthy": 0,
        "unhealthy": 0,
        "unknown": 0
    }

    approval_counts = {
        "approved": 0,
        "rejected": 0,
        "deregistered": 0,
        "pending": 0
    }

    for a in agents:
        h = a.get("health") or "unknown"
        health_counts[h] = health_counts.get(h, 0) + 1

        s = a.get("approval_status") or "pending"
        approval_counts[s] = approval_counts.get(s, 0) + 1

    return {
        "total_agents": len(agents),
        "health_distribution": health_counts,
        "approval_distribution": approval_counts
    }


# -----------------------------
# HEALTH DEBUG
# -----------------------------
def get_debug_agent_health(agent_id: str) -> Optional[Dict[str, Any]]:
    row = database.get_agent_by_id(agent_id)

    if not row:
        return None

    return {
        "agent_id": agent_id,

        "current_health": {
            "health": row.get("health"),
            "latency_ms": row.get("latency_ms"),
            "last_checked": row.get("last_checked")
        },

        "approval_status": row.get("approval_status"),

        "recent_checks": [
            {
                "health": row.get("health"),
                "latency_ms": row.get("latency_ms"),
                "timestamp": row.get("last_checked")
            }
        ],

        "latency_history": (
            [row.get("latency_ms")] if row.get("latency_ms") is not None else []
        ),

        "failure_reasons": [],

        "check_interval_seconds": 60
    }
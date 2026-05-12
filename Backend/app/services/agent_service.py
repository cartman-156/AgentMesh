import json
import hashlib
import requests
from typing import Optional, Dict, Any
from app.core.capability_normalization import normalize_capabilities
from app.db.database import get_db_connection


def generate_agent_id(agent_card: Dict[str, Any]) -> str:
    """
    Generate a deterministic agent_id based on agent card.
    Uses name field if present, otherwise hashes the card.
    """
    if "name" in agent_card and agent_card["name"]:
        name = agent_card["name"].lower().strip().replace(" ", "-")
        return name
    
    # Fallback: hash the card
    card_json = json.dumps(agent_card, sort_keys=True)
    card_hash = hashlib.sha256(card_json.encode()).hexdigest()[:16]
    return f"agent-{card_hash}"


def validate_agent_card(agent_card: Dict[str, Any]) -> bool:
    """
    Validate agent card against A2A-compatible semantics.
    Returns True if valid, raises exception if invalid.
    """
    if not isinstance(agent_card, dict):
        raise ValueError("agent_card must be a dictionary")
    
    # Required fields for A2A compatibility
    required_fields = ["name"]
    for field in required_fields:
        if field not in agent_card:
            raise ValueError(f"Missing required field: {field}")
    
    return True


def fetch_agent_card_from_url(url: str) -> Dict[str, Any]:
    """
    Fetch agent card from URL .well-known/agent.json endpoint.
    """
    if not url:
        raise ValueError("URL cannot be empty")
    
    # Ensure URL doesn't have trailing slash
    url = url.rstrip("/")
    
    # Construct the well-known endpoint
    well_known_url = f"{url}/.well-known/agent.json"
    
    try:
        response = requests.get(well_known_url, timeout=10)
        response.raise_for_status()
        agent_card = response.json()
        
        validate_agent_card(agent_card)
        return agent_card
    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch agent card from {well_known_url}: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in agent card from {well_known_url}: {str(e)}")


def register_agent(
    agent_card: Optional[Dict[str, Any]] = None,
    url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Register a new agent.
    
    Accepts either:
    - agent_card: direct agent card object
    - url: URL to fetch .well-known/agent.json from
    
    Returns: { id, status: "registered", normalized: true }
    """
    # Handle input validation
    if agent_card is None and url is None:
        raise ValueError("Either agent_card or url must be provided")
    
    if agent_card is not None and url is not None:
        raise ValueError("Cannot provide both agent_card and url")
    
    # Fetch from URL if provided
    if url is not None:
        agent_card = fetch_agent_card_from_url(url)
    
    # Validate the card
    validate_agent_card(agent_card)
    
    # Generate agent_id if not present
    agent_id = agent_card.get("id") or generate_agent_id(agent_card)
    
    # Extract capabilities
    raw_capabilities = agent_card.get("capabilities", [])
    if not isinstance(raw_capabilities, list):
        raw_capabilities = [raw_capabilities] if raw_capabilities else []
    
    # Normalize capabilities
    capabilities_result = normalize_capabilities(raw_capabilities)
    
    # Prepare data for storage
    agent_data = {
        "id": agent_id,
        "name": agent_card.get("name", ""),
        "description": agent_card.get("description", ""),
        "url": url or agent_card.get("url", ""),
        "version": agent_card.get("version", ""),
        "capabilities": json.dumps(capabilities_result),
        "raw_agent_card": json.dumps(agent_card),
        "status": "healthy",
        "latency_ms": None,
        "last_seen": None,
        "approved": 0,
        "deregistered": 0,
    }
    
    # Store in database
    store_agent(agent_data)
    
    return {
        "id": agent_id,
        "status": "registered",
        "normalized": True
    }


def store_agent(agent_data: Dict[str, Any]) -> None:
    """
    Store agent in SQLite database.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if agent already exists
        cursor.execute(
            "SELECT id FROM agents WHERE id = ?",
            (agent_data["id"],)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Preserve existing approval and deregistration state when updating an existing agent.
            cursor.execute("SELECT approved, deregistered FROM agents WHERE id = ?", (agent_data["id"],))
            row = cursor.fetchone()
            current_approved = row[0] if row else 0
            current_deregistered = row[1] if row else 0
            updated_approved = agent_data.get("approved", current_approved)
            updated_deregistered = agent_data.get("deregistered", current_deregistered)

            cursor.execute('''
                UPDATE agents SET
                    name = ?,
                    description = ?,
                    url = ?,
                    version = ?,
                    capabilities = ?,
                    raw_agent_card = ?,
                    status = ?,
                    latency_ms = ?,
                    last_seen = ?,
                    approved = ?,
                    deregistered = ?
                WHERE id = ?
            ''', (
                agent_data["name"],
                agent_data["description"],
                agent_data["url"],
                agent_data["version"],
                agent_data["capabilities"],
                agent_data["raw_agent_card"],
                agent_data["status"],
                agent_data["latency_ms"],
                agent_data["last_seen"],
                updated_approved,
                updated_deregistered,
                agent_data["id"]
            ))
        else:
            # Insert new agent
            cursor.execute('''
                INSERT INTO agents
                (id, name, description, url, version, capabilities, raw_agent_card, status, latency_ms, last_seen, approved, deregistered)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                agent_data["id"],
                agent_data["name"],
                agent_data["description"],
                agent_data["url"],
                agent_data["version"],
                agent_data["capabilities"],
                agent_data["raw_agent_card"],
                agent_data["status"],
                agent_data["latency_ms"],
                agent_data["last_seen"],
                agent_data.get("approved", 0),
                agent_data.get("deregistered", 0)
            ))
        
        conn.commit()


def get_agent_by_id(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve agent from database by ID.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return dict(row)


def refresh_agent(agent_id: str) -> Dict[str, Any]:
    """
    Refresh an agent by re-fetching its agent card from the stored URL.
    
    Parameters:
    - agent_id: Agent identifier
    
    Returns: { status, source_refetched }
    """
    # Get existing agent from database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
    
    if not row:
        raise ValueError(f"Agent {agent_id} not found")
    
    agent = dict(row)
    url = agent.get("url")
    
    if not url:
        raise ValueError(f"Agent {agent_id} has no URL for refresh")
    
    # Fetch fresh agent card from URL
    updated_agent_card = fetch_agent_card_from_url(url)
    
    # Validate the updated card
    validate_agent_card(updated_agent_card)
    
    # Extract and normalize capabilities
    raw_capabilities = updated_agent_card.get("capabilities", [])
    if not isinstance(raw_capabilities, list):
        raw_capabilities = [raw_capabilities] if raw_capabilities else []
    
    capabilities_result = normalize_capabilities(raw_capabilities)
    
    # Prepare update data (preserve agent_id, update mutable fields)
    agent_data = {
        "id": agent_id,  # Preserve existing agent_id
        "name": updated_agent_card.get("name", agent.get("name", "")),
        "description": updated_agent_card.get("description", agent.get("description", "")),
        "url": url,  # Keep the original URL
        "version": updated_agent_card.get("version", agent.get("version", "")),
        "capabilities": json.dumps(capabilities_result),
        "raw_agent_card": json.dumps(updated_agent_card),
        "status": agent.get("status", "healthy"),  # Preserve current status
        "latency_ms": agent.get("latency_ms"),  # Preserve latency
        "last_seen": agent.get("last_seen"),  # Preserve last_seen
        "approved": agent.get("approved", 0),
    }
    
    # Update agent in database
    store_agent(agent_data)
    
    return {
        "status": "refreshed",
        "source_refetched": True
    }


def deregister_agent(agent_id: str) -> Dict[str, Any]:
    """
    Soft-deregister an agent while preserving registry history.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT deregistered FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()

        if not row:
            raise ValueError(f"Agent {agent_id} not found")

        if row[0] == 1:
            return {"id": agent_id, "status": "deregistered"}

        cursor.execute(
            "UPDATE agents SET deregistered = 1 WHERE id = ?",
            (agent_id,)
        )
        conn.commit()

    return {"id": agent_id, "status": "deregistered"}


def approve_agent(agent_id: str) -> Dict[str, Any]:
    """
    Approve a registered agent so it becomes discoverable.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()

        if not row:
            raise ValueError(f"Agent {agent_id} not found")

        agent = dict(row)
        if agent.get("approved", 0) == 1:
            return {"id": agent_id, "status": "approved"}

        cursor.execute(
            "UPDATE agents SET approved = 1 WHERE id = ?",
            (agent_id,)
        )
        conn.commit()

    return {"id": agent_id, "status": "approved"}


def list_agents(
    status: Optional[str] = None,
    capability: Optional[str] = None
) -> Dict[str, Any]:
    """
    List agents with optional filtering.
    
    Parameters:
    - status: Filter by agent status (healthy/unhealthy)
    - capability: Filter by canonical capability
    
    Returns: { agents: [...], total: number }
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Build query with filters
        query = "SELECT * FROM agents WHERE approved = 1 AND deregistered = 0"
        params = []
        
        # Filter by status
        if status is not None:
            query += " AND status = ?"
            params.append(status)
        
        # Execute query
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert rows to dictionaries
        agents = [dict(row) for row in rows]
        
        # Filter by capability (client-side, using canonical matching)
        if capability is not None:
            filtered_agents = []
            for agent in agents:
                try:
                    capabilities_data = json.loads(agent["capabilities"])
                    canonical_caps = capabilities_data.get("canonical_capabilities", [])
                    
                    if capability in canonical_caps:
                        filtered_agents.append(agent)
                except (json.JSONDecodeError, TypeError):
                    pass
            
            agents = filtered_agents
        
        return {
            "agents": agents,
            "total": len(agents)
        }

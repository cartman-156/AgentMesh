from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.agent_service import register_agent, list_agents, get_agent_by_id, refresh_agent, approve_agent, deregister_agent

router = APIRouter()


class RegisterAgentRequest(BaseModel):
    agent_card: Optional[Dict[str, Any]] = None
    url: Optional[str] = None


@router.post("")
def post_register_agent(request: RegisterAgentRequest):
    """
    Register a new agent.
    
    Accepts either:
    - agent_card: direct agent card object
    - url: URL to fetch .well-known/agent.json from
    
    Returns: { id, status: "registered", normalized: true }
    """
    try:
        result = register_agent(
            agent_card=request.agent_card,
            url=request.url
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_agents(
    status: Optional[str] = Query(None),
    capability: Optional[str] = Query(None)
):
    """
    List agents with optional filtering.
    
    Query Parameters:
    - status: Filter by agent status (healthy/unhealthy)
    - capability: Filter by canonical capability
    
    Returns: { agents: [...], total: number }
    """
    try:
        result = list_agents(status=status, capability=capability)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}")
def get_agent(agent_id: str):
    """
    Get a single agent by ID.
    
    Returns: { agent: object }
    """
    try:
        agent = get_agent_by_id(agent_id)
        if agent is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"agent": agent}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{agent_id}/approve")
def post_approve_agent(agent_id: str):
    """
    Approve a registered agent so it becomes discoverable.

    Returns: { id, status: "approved" }
    """
    try:
        result = approve_agent(agent_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{agent_id}")
def delete_agent(agent_id: str):
    """
    Deregister an agent while preserving registry history.

    Returns: { id, status: "deregistered" }
    """
    try:
        result = deregister_agent(agent_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{agent_id}/refresh")
def post_refresh_agent(agent_id: str):
    """
    Refresh an agent by re-fetching its agent card from the stored URL.
    
    Returns: { status, source_refetched }
    """
    try:
        result = refresh_agent(agent_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

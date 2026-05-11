from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.debug.service import (
    get_debug_agent,
    debug_search,
    get_debug_state,
    get_debug_agent_health
)

router = APIRouter()


@router.get("/agents/{agent_id}")
def get_debug_agent_endpoint(agent_id: str):
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
    try:
        result = get_debug_agent(agent_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
def get_debug_search_endpoint(
    agent_id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    capability: Optional[str] = Query(None),
    match: Optional[str] = Query(None)
):
    """
    Debug search with trace information.
    
    Returns:
    - input query
    - normalization steps
    - canonical mapping result
    - matching strategy
    - matched agent_ids with reasons
    """
    try:
        result = debug_search(
            agent_id=agent_id,
            name=name,
            capability=capability,
            match=match
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/state")
def get_debug_state_endpoint():
    """
    Get system-wide debug state information.
    
    Returns:
    - total agents
    - health distribution
    - canonical capability distribution
    - unclassified capabilities
    """
    try:
        result = get_debug_state()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/{agent_id}")
def get_debug_health_endpoint(agent_id: str):
    """
    Get detailed health check information for an agent.
    
    Returns:
    - recent health checks
    - latency history
    - failure reasons
    - timestamps
    """
    try:
        result = get_debug_agent_health(agent_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

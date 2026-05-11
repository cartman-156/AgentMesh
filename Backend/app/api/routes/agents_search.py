from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.agents_search_service import search_agents

router = APIRouter()


@router.get("/search")
def get_search_agents(
    agent_id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    capability: Optional[str] = Query(None),
    match: Optional[str] = Query(None)
):
    """
    Search agents with deterministic filtering.
    
    Query Parameters:
    - agent_id: Exact match only (no partial matching)
    - name: Supports partial or exact match based on `match` parameter
    - capability: Uses canonical capability matching
    - match: "partial" or "exact" (applies to name and capability only)
    
    All filters use AND semantics.
    
    Returns: { query, results: [...] }
    """
    try:
        result = search_agents(
            agent_id=agent_id,
            name=name,
            capability=capability,
            match=match
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

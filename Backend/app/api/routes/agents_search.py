from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.agents_search_service import search_agents

router = APIRouter()


@router.get("/search")
def get_search_agents(
    agent_id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    capability: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    only_approved: bool = Query(False),
    match: Optional[str] = Query(None)
):
    """
    Search agents with multi-field discovery and deterministic filtering.
    
    Query Parameters:
    - agent_id: Exact match only (no partial matching)
    - name: Supports partial or exact match based on `match` parameter
    - capability: Uses canonical capability matching
    - description: Searches agent descriptions
    - skills: Searches agent skill sets
    - only_approved: Only show approved agents
    - match: "partial" or "exact" (applies to name and capability only)
    
    All filters use AND semantics.
    
    Returns: { query, results: [...] }
    """
    try:
        result = search_agents(
            agent_id=agent_id,
            name=name,
            capability=capability,
            description=description,
            skills=skills,
            only_approved=only_approved,
            match=match
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

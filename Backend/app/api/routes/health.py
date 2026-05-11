from fastapi import APIRouter, HTTPException
from app.services.health_service import get_agent_health, get_system_health

router = APIRouter()


@router.get("/health")
def get_system_health_endpoint():
    """
    Get system-wide health metrics.
    
    Returns: { agents_total, healthy, unhealthy, avg_latency_ms }
    """
    try:
        result = get_system_health()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}/health")
def get_agent_health_endpoint(agent_id: str):
    """
    Get health information for a specific agent.
    
    Returns: { status, latency_ms, last_checked }
    """
    try:
        result = get_agent_health(agent_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

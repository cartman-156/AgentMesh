from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SearchAgentsQuery(BaseModel):
    agent_id: Optional[str] = None
    name: Optional[str] = None
    capability: Optional[str] = None
    match: Optional[str] = None  # "partial" or "exact"


class SearchAgentsResponse(BaseModel):
    query: Dict[str, Any]
    results: List[Dict[str, Any]]

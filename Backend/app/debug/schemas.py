from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class DebugAgentResponse(BaseModel):
    agent_id: str
    raw_agent_card: Dict[str, Any]
    raw_capabilities: List[str]
    normalized_capabilities: List[str]
    canonical_capabilities: List[str]
    stored_fields: Dict[str, Any]
    health_state: Dict[str, Any]
    ingestion_trace: Dict[str, Any]


class DebugSearchResponse(BaseModel):
    input_query: Dict[str, Any]
    normalization_steps: List[str]
    canonical_mapping: Optional[Dict[str, Any]]
    matching_strategy: Dict[str, Any]
    matched_agents: List[Dict[str, Any]]


class DebugStateResponse(BaseModel):
    total_agents: int
    health_distribution: Dict[str, int]
    canonical_capability_distribution: Dict[str, int]
    unclassified_capabilities: List[str]


class DebugHealthResponse(BaseModel):
    agent_id: str
    current_health: Dict[str, Any]
    recent_checks: List[Dict[str, Any]]
    latency_history: List[Optional[int]]
    failure_reasons: List[str]
    check_interval_seconds: int

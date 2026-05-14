from pydantic import BaseModel, Field
from typing import List, Optional

class AgentRegistration(BaseModel):
    id: str = Field(..., description="Unique identifier for the agent")
    name: str
    description: str
    url: str
    version: str
    capabilities: List[str]
    domain: str = Field(..., description="E.g., RAN, TRANSPORT, CORE, MULTI")
    company: str

class Alarm(BaseModel):
    id: str
    severity: str
    layer: str  # RAN, TRANSPORT, CORE
    message: str
    timestamp: str

class IncidentRequest(BaseModel):
    incident_id: str
    alarms: List[Alarm]
    context: Optional[str] = ""

class AnalysisResult(BaseModel):
    incident_id: str
    root_cause: str
    confidence: float
    failure_domain: str # RAN, TRANSPORT, CORE, CROSS, UNKNOWN
    escalated_to: Optional[List[str]] = []
    
class A2ARequest(BaseModel):
    incident_id: str
    domain_to_analyze: str
    alarms: List[Alarm]

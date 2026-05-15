from fastapi import FastAPI, HTTPException
from typing import List
from .models import AgentRegistration, IncidentRequest, AnalysisResult, A2ARequest
from .registry import registry_db
from .rca_service import perform_rca

# Import from official A2A SDK
from a2a.types.a2a_pb2 import AgentCapabilities, AgentCard, AgentInterface, AgentSkill
from a2a.utils.constants import TransportProtocol
from a2a.server.routes import create_agent_card_routes

app = FastAPI(
    title="Network RCA Agent (Tier-1)", 
    description="Agent2Agent (A2A) compatible Network Incident & Outage Management Agent",
    version="1.0.0"
)

# 1. Define Official A2A SDK Agent Card with Skills
official_agent_card = AgentCard(
    name='Network RCA Agent',
    description='Performs cross-layer RCA for telecom incidents',
    version='1.0.0',
    capabilities=AgentCapabilities(streaming=False, push_notifications=False),
    default_input_modes=['application/json'],
    default_output_modes=['application/json'],
    supported_interfaces=[
        AgentInterface(
            protocol_binding=TransportProtocol.HTTP_JSON,
            url='http://rca-agent:8080/analyze-incident',
        )
    ],
    skills=[
        AgentSkill(
            id='alarm_correlation',
            name='Alarm Correlation',
            description='Correlates alarms across RAN, Transport, and Core network layers',
            tags=['telecom', 'alarm_correlation', 'network', 'ran', 'transport', 'core network'],
        ),
        AgentSkill(
            id='rca_analysis',
            name='RCA Analysis',
            description='LLM-powered root cause analysis for telecom incidents',
            tags=['telecom', 'rca_analysis', 'root cause analysis', 'incident management'],
        ),
        AgentSkill(
            id='failure_classification',
            name='Failure Domain Classification',
            description='Classifies failure domain: RAN, TRANSPORT, CORE, or CROSS',
            tags=['telecom', 'failure_classification', 'outage management', '5g', 'lte'],
        ),
    ]
)

from a2a.server.request_handlers.response_helpers import agent_card_to_dict

@app.get("/.well-known/agent.json", tags=["A2A"])
async def get_agent_card():
    """Serve the A2A Agent Card with capabilities list for AgentMesh compatibility."""
    card_dict = agent_card_to_dict(official_agent_card)
    # Add a flat capabilities list extracted from skills tags for AgentMesh backend compatibility
    all_tags = []
    for skill in card_dict.get("skills", []):
        all_tags.extend(skill.get("tags", []))
    # Deduplicate while preserving order
    seen = set()
    unique_tags = []
    for tag in all_tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)
    card_dict["capabilities"] = unique_tags
    return card_dict

@app.on_event("startup")
async def startup_event():
    # Auto-register itself on startup (using our legacy/custom schema for internal registry tracking)
    registry_db.register(AgentRegistration(
        id="rca-agent-01",
        name="Network RCA Agent",
        description="Performs cross-layer RCA for telecom incidents",
        url="http://rca-agent:8080",
        version="1.0.0",
        capabilities=["alarm_correlation", "rca_analysis", "failure_classification"],
        domain="MULTI",
        company="TelecomCorp"
    ))

@app.post("/register", response_model=AgentRegistration, tags=["Registry"])
async def register_agent(agent: AgentRegistration):
    """Register an agent with the A2A registry."""
    return registry_db.register(agent)

@app.get("/agents", response_model=List[AgentRegistration], tags=["Registry"])
async def list_agents():
    """List all registered A2A agents."""
    return registry_db.get_all()

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/analyze-incident", response_model=AnalysisResult, tags=["RCA"])
async def analyze_incident(req: IncidentRequest):
    """Primary endpoint for incident analysis."""
    if not req.alarms:
        raise HTTPException(status_code=400, detail="Alarms list cannot be empty")
    return await perform_rca(req.incident_id, req.alarms)

@app.post("/a2a/request-analysis", response_model=AnalysisResult, tags=["A2A"])
async def a2a_request_analysis(req: A2ARequest):
    """A2A endpoint called by other agents requesting specialized analysis."""
    if not req.alarms:
        raise HTTPException(status_code=400, detail="Alarms list cannot be empty")
    return await perform_rca(req.incident_id, req.alarms)

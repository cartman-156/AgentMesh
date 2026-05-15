from typing import Dict, List
from .models import AgentRegistration

class AgentRegistry:
    def __init__(self):
        self.agents: Dict[str, AgentRegistration] = {}
        
    def register(self, agent: AgentRegistration) -> AgentRegistration:
        self.agents[agent.id] = agent
        return agent
        
    def get_all(self) -> List[AgentRegistration]:
        return list(self.agents.values())
        
    def get_by_domain(self, domain: str) -> List[AgentRegistration]:
        return [
            a for a in self.agents.values() 
            if a.domain.upper() == domain.upper() or a.domain.upper() == "MULTI"
        ]

# In-memory registry singleton
registry_db = AgentRegistry()

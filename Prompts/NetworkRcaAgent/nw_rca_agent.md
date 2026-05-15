You are a senior AI systems architect and backend engineer. Refer the A2A protocol github code at https://github.com.mcas.ms/a2aproject/A2A
 
Design and implement a single standalone Network RCA Agent for "Network Incident & Outage Management (Tier‑1 RCA Agent)" with the following requirements.
 
----------------------------------------
🎯 OBJECTIVE
----------------------------------------
Build a Network Root Cause Analysis (RCA) Agent capable of:
- Correlating alarms across telecom network layers:
  - RAN (Radio Access Network)
  - Transport (IP/MPLS/Optical)
  - Core Network
- Identifying the most likely failure domain
- Escalating / collaborating with other agents if unable to resolve
 
This agent must support A2A (Agent-to-Agent) communication.
 
----------------------------------------
🧠 CORE CAPABILITIES
----------------------------------------
1. Alarm Correlation Engine
2. RCA Analysis (LLM-powered)
3. Failure Domain Classification:
   - RAN
   - TRANSPORT
   - CORE
   - CROSS
 
4. A2A Collaboration:
   - Contact other agents if confidence is low
 
----------------------------------------
🧾 AGENT REGISTRATION (MANDATORY)
----------------------------------------
The agent must support registration with an Agent Registry.
 
Currently, agent registration supports the following fields as input and the agent must store and expose them:
 
{
  "id": "string (unique identifier)",
  "name": "string",
  "description": "string",
  "url": "string (base endpoint of the agent)",
  "version": "string",
  "capabilities": ["list of supported operations"],
  "domain": "e.g., RAN|TRANSPORT|CORE|MULTI",
  "company": "string"
}
 
✅ Requirements:
- Implement an endpoint: POST /register
- Store registration data in-memory or persistent storage
- Validate required fields
- Use this registry for A2A discovery
 
✅ Example:
{
  "id": "rca-agent-01",
  "name": "Network RCA Agent",
  "description": "Performs cross-layer RCA for telecom incidents",
  "url": "http://rca-agent:8080",
  "version": "1.0.0",
  "capabilities": ["alarm_correlation", "rca_analysis", "failure_classification"],
  "domain": "MULTI",
  "company": "YourCompany"
}
 
----------------------------------------
🌐 API DESIGN
----------------------------------------
 
1. POST /analyze-incident  
(Primary RCA endpoint)
 
2. POST /a2a/request-analysis  
(Agent-to-agent request)
 
3. POST /register  
(Register agent)
 
4. GET /agents  
(List registered agents)
 
5. GET /health  
 
----------------------------------------
🤖 LLM INTEGRATION
----------------------------------------
- Use LLM to:
   - Analyze alarm patterns
   - Infer root cause
   - Classify failure domain
 
----------------------------------------
🔗 A2A COMMUNICATION
----------------------------------------
- Use registered agents for:
   - Discovery
   - Collaboration
- If unresolved:
   - Call relevant agents based on domain
   - Aggregate results
 
----------------------------------------
🐳 DEPLOYMENT
----------------------------------------
- Dockerized application
- Expose port 8080 (well-known A2A port)
- Provide Dockerfile
 
----------------------------------------
📦 DELIVERABLES
----------------------------------------
- Full code (FastAPI)
- Dockerfile
- Sample agent registration
- Example A2A flow
 
----------------------------------------
IMPORTANT
----------------------------------------
- Must be runnable
- Use clean architecture
- No pseudo-code
- Use typed models (Pydantic)
 
----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return:
1. Architecture
2. Code
3. Docker setup
4. API examples
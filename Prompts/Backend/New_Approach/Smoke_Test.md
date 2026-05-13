Follow:
- System_Role.md
- API_Contract.md
- Response_Rules.md
- Structure_Rules.md

Task:
Create standalone validation script for AgentMesh backend.

File:
scripts/validate_agentmesh.py

Purpose:
Validate backend correctness and operational readiness.

Requirements:

1. Connectivity check
- verify backend at http://localhost:8000

2. System health validation
- call GET /api/v1/health

3. Agent registration test
- register sample JSON agent

4. URL ingestion test
- register agent using URL ingestion

5. List agents
- verify at least one agent exists

6. Capability search
- verify search returns results

7. Refresh flow
- validate refresh endpoint behavior

Output Behavior:
- print step-by-step execution logs
- print PASS / FAIL per step
- print final summary

Implementation Rules:
- use Python stdlib + requests/httpx only
- no pytest
- no mocks
- hit real endpoints only

Constraints:
- must run via:
  python scripts/validate_agentmesh.py

Do NOT:
- modify backend implementation
- assume undocumented endpoints
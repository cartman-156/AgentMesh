Follow:
- System_Role.md
- API_Contract.md
- Capability_Rule.md
- Database_Rules.md
- Worker_Rules.md
- Response_Rules.md

Task:
Generate complete unit and integration test suite for AgentMesh backend.

Framework:
- pytest
- optional FastAPI TestClient or httpx

Structure:

/tests
  test_agents.py
  test_capabilities.py
  test_search.py
  test_health.py
  test_refresh.py

Coverage Requirements:

1. Agent Registration
- valid registration
- invalid schema rejection
- URL ingestion
- duplicate handling

2. Capability Normalization
- lowercase normalization
- symbol cleanup
- canonical mapping
- unknown → unclassified

3. Search
- exact matching
- partial matching
- canonical mapping correctness
- no-match behavior

4. Database
- persistence validation
- retrieval correctness
- duplicate protection

5. Health Checks
- simulated worker execution
- latency recording
- health transitions
- timeout/error handling

6. Refresh Flow
- remote re-fetch
- field updates
- stable agent_id

Mocking Rules:
- mock external URL fetches only
- use real SQLite test DB
- do NOT mock internal business logic

Constraints:
- no backend modifications
- no API mutations
- no unnecessary dependencies

Output:
- fully runnable pytest suite
- isolated tests
- deterministic assertions
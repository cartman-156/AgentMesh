Create a standalone Python validation script to test the AgentMesh backend.

---

# PURPOSE

The script must validate that the backend is correctly implemented and fully operational.

It should act as a "smoke test + functional verification tool".

---

# FILE LOCATION

Create:

/scripts/validate_agentmesh.py

---

# REQUIREMENTS

The script must:

## 1. Connectivity check
- verify backend is reachable at http://localhost:8000

## 2. Health check validation
- call GET /api/v1/health
- print system stats

## 3. Agent registration test (JSON)
- register a sample agent using POST /agents
- verify response contains valid agent_id

## 4. Agent registration test (URL ingestion)
- register agent using a mock or known URL
- validate ingestion response

## 5. List agents
- call GET /agents
- verify at least 1 agent exists

## 6. Capability search test
- search for a known capability
- verify at least one result is returned

## 7. Agent refresh test
- call POST /agents/{id}/refresh
- validate update response

---

# OUTPUT BEHAVIOR

The script must:

- print step-by-step execution logs
- clearly mark PASS / FAIL for each step
- print final summary report

Example:

[PASS] Health check OK
[PASS] Agent registration OK
[FAIL] Capability search returned empty results

---

# IMPLEMENTATION RULES

- Use only Python standard library + requests (or httpx if already used in backend)
- Do NOT require pytest or external frameworks
- Must be runnable via:

python scripts/validate_agentmesh.py

---

# BACKEND ASSUMPTION

Assume backend is running at:

http://localhost:8000

---

# CRITICAL RULES

- Do NOT modify backend code
- Do NOT depend on test framework infrastructure
- Do NOT mock responses — always hit real endpoints
- Do NOT assume undocumented endpoints
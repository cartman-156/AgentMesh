Generate a complete unit + integration test suite for the existing AgentMesh backend.

---

# PURPOSE

Create automated tests that validate correctness of:

- API endpoints
- capability normalization pipeline
- database operations (SQLite)
- health check worker logic (synchronous simulation if needed)
- agent ingestion (JSON + URL-based)

---

# TEST FRAMEWORK

Use:
- pytest

Optional:
- httpx or FastAPI TestClient

---

# TEST STRUCTURE

Create:

/tests
  test_agents.py
  test_capabilities.py
  test_search.py
  test_health.py
  test_refresh.py

---

# TEST COVERAGE REQUIREMENTS

## 1. Agent Registration Tests

- valid JSON agent card registration
- invalid schema rejection
- URL-based ingestion (mock external fetch)
- duplicate agent handling

---

## 2. Capability Normalization Tests

Verify:

- lowercase normalization
- symbol cleanup (-, _)
- mapping to canonical via capabilities_map.py
- unknown capability → "unclassified"

---

## 3. Search Tests

- exact match capability search
- partial match search
- canonical mapping correctness
- no-match scenario

---

## 4. Database Tests

- agent persistence after insert
- correct field storage
- retrieval correctness
- no duplicate corruption

---

## 5. Health System Tests

- simulated health check execution
- latency recording
- status updates (healthy/unhealthy)
- failure handling (timeouts, errors)

---

## 6. Refresh Flow Tests

- re-fetch agent card (mock external call)
- update stored fields correctly
- agent_id remains stable

---

# MOCKING RULES

- mock external URL fetches only
- do NOT mock internal business logic
- DB must be real SQLite (test instance allowed)

---

# CRITICAL RULES

- DO NOT modify backend implementation
- DO NOT change API contracts
- DO NOT introduce new dependencies beyond pytest/httpx
- Tests must reflect actual current implementation only

---

# OUTPUT REQUIREMENT

Generate:
- fully runnable pytest suite
- clear assertions
- isolated test cases per module
- minimal but complete coverage
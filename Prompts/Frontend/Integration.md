Validate full AgentMesh backend integration end-to-end.

---

# PURPOSE

Ensure that all backend components work together correctly after implementation:

- API layer
- service layer
- database layer
- capability normalization system
- health monitoring worker
- optional observability layer (if implemented)

---

# EXECUTION REQUIREMENTS

Run a full system verification against the running backend (assume Docker or local run).

---

# VALIDATION CHECKS

## 1. System startup
- backend starts without errors
- FastAPI app loads correctly
- SQLite database initializes successfully

---

## 2. Agent Registration Flow
Test both:

### A. JSON-based registration
- POST /api/v1/agents with agent_card
- verify agent_id returned
- verify stored in DB

### B. URL-based registration
- POST /api/v1/agents with URL
- verify fetch + validation + storage works

---

## 3. Capability Normalization
- verify raw → normalized → canonical pipeline
- ensure canonical_capabilities stored correctly
- ensure no duplicate or malformed entries

---

## 4. Agent Listing
- GET /api/v1/agents
- verify correct data retrieval
- verify filtering works (status/capability if implemented)

---

## 5. Capability Search
- GET /api/v1/agents/search
- verify:
  - normalization applied to query
  - correct canonical mapping used
  - correct agents returned

---

## 6. Health System
- verify background worker is running
- verify health updates are being stored
- verify latency and status fields are updated correctly

---

## 7. Agent Refresh
- POST /api/v1/agents/{id}/refresh
- verify:
  - remote fetch happens
  - DB updates correctly
  - agent_id remains stable

---

## 8. Data Consistency Check
Ensure:
- no duplicate agents
- no null capability entries
- no corrupted JSON in DB

---

# FAILURE RULE

If any step fails:
- identify exact layer responsible (API / service / DB / worker)
- do NOT modify architecture
- only suggest minimal fixes

---

# OUTPUT FORMAT

Return:

- step-by-step results
- PASS/FAIL per check
- final summary:
  - system status
  - critical issues (if any)
  - readiness for frontend integration
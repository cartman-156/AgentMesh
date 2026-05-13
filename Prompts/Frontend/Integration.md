Validate full AgentMesh backend integration end-to-end.

---

# PURPOSE

Ensure that all backend components work together correctly after implementation:

- API layer
- service layer
- database layer
- capability normalization system
- health monitoring worker
- agent lifecycle management system (approve/reject/deregister)
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
- all lifecycle tables/fields are correctly initialized (if applicable)

---

## 2. Agent Registration Flow
Test both:

### A. JSON-based registration
- POST /api/v1/agents with agent_card
- verify agent_id returned
- verify stored in DB
- verify initial lifecycle state = `registered`

### B. URL-based registration
- POST /api/v1/agents with URL
- verify fetch + validation + storage works
- verify lifecycle state = `registered`

---

## 3. Capability Normalization
- verify raw → normalized → canonical pipeline
- ensure canonical_capabilities stored correctly
- ensure no duplicate or malformed entries
- ensure normalization is identical across:
  - registration
  - refresh flow

---

## 4. Agent Listing (Lifecycle Aware)
- GET /api/v1/agents
- verify correct data retrieval
- verify lifecycle state included in response
- verify filtering works:
  - status (registered / approved / deregistered)
  - capability (if implemented)
- ensure rejected agents are NOT returned (if hard delete is implemented)

---

## 5. Capability Search (Lifecycle Aware)
- GET /api/v1/agents/search
- verify:
  - normalization applied to query
  - correct canonical mapping used
  - correct agents returned
  - only valid lifecycle states are included in results

---

## 6. Agent Approval Flow
- POST /api/v1/agents/{id}/approve
- verify:
  - state transitions to `approved`
  - agent becomes discoverable
  - DB state persists correctly
- ensure idempotency:
  - repeated approve does not break system

---

## 7. Agent Reject Flow (if implemented)
- trigger reject action (as defined in backend)
- verify:
  - agent is permanently removed
  - agent no longer exists in DB
  - agent not returned in list/search
- ensure idempotent behavior:
  - repeated reject does not error

---

## 8. Agent Deregistration Flow
- DELETE /api/v1/agents/{id}
- verify:
  - state transitions to `deregistered`
  - agent excluded from discovery/search
  - DB update persists correctly
- ensure idempotency

---

## 9. Health System
- verify background worker is running
- verify health updates are being stored
- verify latency and status fields are updated correctly
- ensure health checks do not include deregistered agents in active metrics (if applicable)

---

## 10. Agent Refresh
- POST /api/v1/agents/{id}/refresh
- verify:
  - remote fetch happens
  - DB updates correctly
  - agent_id remains stable
  - lifecycle state is preserved
  - no unintended state reset occurs

---

## 11. Data Consistency Check
Ensure:
- no duplicate agents
- no null capability entries
- no corrupted JSON in DB
- no orphaned lifecycle states
- no agents exist with invalid status values

---

# FAILURE RULE

If any step fails:
- identify exact layer responsible (API / service / DB / worker / lifecycle system)
- do NOT modify architecture
- only suggest minimal fixes

---

# OUTPUT FORMAT

Return:

- step-by-step results
- PASS/FAIL per check
- lifecycle behavior summary
- final system summary:
  - system status
  - critical issues (if any)
  - readiness for frontend integration
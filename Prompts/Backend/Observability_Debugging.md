Add the Observability (Debug) Layer to the existing AgentMesh backend.

CRITICAL CONTEXT:
- Core API (/api/v1/*) is already implemented and MUST NOT be modified
- This is an additive, read-only introspection layer
- Must reflect actual runtime + database state ONLY
- No simulation or inferred data allowed

---

# PURPOSE

Implement a structured debugging and observability layer to inspect:

- agent ingestion behavior
- capability normalization pipeline
- search resolution logic
- health check execution details
- system-wide state distribution

This is for internal/system inspection only.

---

# API SCOPE (NEW ADDITION ONLY)

Implement ONLY the following endpoints under:

/api/v1/debug/*

---

## 1. GET /api/v1/debug/agents/{agent_id}

Return full internal state of a single agent:

Must include:
- raw_agent_card
- raw_capabilities
- normalized_capabilities
- canonical_capabilities
- stored DB fields
- health state (latest + last error if any)
- ingestion_trace (actual executed steps, derived from code execution)

---

## 2. GET /api/v1/debug/search?capability=xxx

Return full search execution trace:

Must include:
- input query
- normalization steps (actual applied transformations)
- canonical mapping result
- matching strategy used (exact / partial / canonical)
- matched agent_ids with score/reason

---

## 3. GET /api/v1/debug/state

Return system-wide snapshot:

Must include:
- total agents
- health distribution
- capability distribution (canonical only)
- list of unclassified capabilities (if any exist in DB)

---

## 4. GET /api/v1/debug/health/{agent_id}

Return full health execution history:

Must include:
- last N health checks (in-memory or DB stored)
- latency values
- failure reasons (if any)
- timestamped results

---

# IMPLEMENTATION RULES

## 1. STRICT NON-INTERFERENCE RULE

- DO NOT modify any existing /api/v1/* endpoints
- DO NOT modify request/response formats of core APIs
- DO NOT change database schema
- DO NOT alter capability normalization logic behavior

---

## 2. DATA SOURCE RULE

Debug layer MUST use ONLY:

- existing database tables
- runtime in-memory state (if already present)
- actual execution traces from services

DO NOT:
- generate synthetic debug data
- infer missing state
- approximate results

---

## 3. INSTRUMENTATION RULE (IMPORTANT)

If required, minimally instrument existing services to capture:

- capability normalization steps
- search resolution decisions
- health check results

BUT:
- instrumentation must not affect performance significantly
- must not change business logic behavior

---

## 4. STRUCTURE RULE

Add debug layer as a separate module:

app/
  debug/
    routes.py
    service.py
    schemas.py

OR equivalent structure that DOES NOT interfere with core modules.

---

## 5. OUTPUT FORMAT RULE

All debug endpoints must return:

- deterministic JSON
- no wrappers like "success", "data", etc.
- no extra metadata unless explicitly defined above

---

# GOAL

The observability layer must allow a developer to answer:

- Why did this agent match?
- How was this capability normalized?
- Why did search return no results?
- Why is this agent unhealthy?
- What is the current system state distribution?

with full traceability from real system execution.
Follow:
- System_Role.md
- Architecture_Rules.md
- Response_Rules.md
- Structure_Rules.md

Task:
Implement observability and debugging layer for AgentMesh.

Critical Context:
- existing /api/v1/* APIs are immutable
- debug layer is additive and read-only
- debug data must reflect actual runtime state only

Implement ONLY:
/api/v1/debug/*

Required Endpoints:

1. GET /api/v1/debug/agents/{agent_id}
Return:
- raw_agent_card
- raw_capabilities
- normalized_capabilities
- canonical_capabilities
- stored DB fields
- health state
- ingestion_trace

2. GET /api/v1/debug/search
Return:
- input query
- normalization steps
- canonical mapping result
- matching strategy
- matched agent_ids with reasons

3. GET /api/v1/debug/state
Return:
- total agents
- health distribution
- canonical capability distribution
- unclassified capabilities

4. GET /api/v1/debug/health/{agent_id}
Return:
- recent health checks
- latency history
- failure reasons
- timestamps

Implementation Rules:
- MUST NOT modify existing /api/v1/* behavior
- MUST NOT change DB schema
- MUST NOT alter normalization logic
- MUST use:
  - existing DB state
  - runtime state
  - actual execution traces only

Instrumentation Rules:
- minimal instrumentation only if required
- no business logic mutation
- no synthetic debug data

Structure:
app/
  debug/
    routes.py
    service.py
    schemas.py

Output:
- deterministic JSON only
- no wrappers
- no hidden metadata
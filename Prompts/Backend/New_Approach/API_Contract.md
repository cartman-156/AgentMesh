# API CONTRACT

## Register Agent
POST /api/v1/agents

Input:
- { agent_card: object }
OR
- { url: string }

Output:
- { id, status: "registered", normalized: true }

---

## List Agents
GET /api/v1/agents

Filters:
- status
- capability

Output:
- { agents: [...], total: number }

---

## Get Agent
GET /api/v1/agents/{agent_id}

Output:
- { agent: object }

---

## 4. Search Agents

GET /api/v1/agents/search

Query Parameters:
- agent_id (string, optional)
- name (string, optional)
- capability (string, optional)
- match (partial | exact, optional; applies to name + capability only)

Behavior:
- agent_id: exact deterministic match only (no partial matching)
- name: supports partial or exact match based on `match`
- capability: uses canonical capability matching via normalization pipeline
- multiple filters use AND semantics

Output:
- { query, results: [...] }

---

## Agent Health
GET /api/v1/agents/{agent_id}/health

Output:
- { status, latency_ms, last_checked }

---

## System Health
GET /api/v1/health

Output:
- { agents_total, healthy, unhealthy, avg_latency_ms }

---

## Refresh Agent
POST /api/v1/agents/{agent_id}/refresh

Output:
- { status, source_refetched }

---

## Approve Agent

POST /api/v1/agents/{agent_id}/approve

Output:
- { id, status: "approved" }

---

## Deregister Agent

DELETE /api/v1/agents/{agent_id}

Output:
- { id, status: "deregistered" }

## IMMUTABLE RULES

DO NOT:
- add endpoints
- change response shapes
- wrap responses
- mutate field names
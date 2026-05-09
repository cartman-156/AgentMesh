PROJECT: AgentMesh

TYPE: AI Agent Registry (Google A2A Agent Card compatible system)

---

# PURPOSE

AgentMesh is a registry system for AI agents that enables:

- Registration of agents via Agent Cards (JSON or URL-based ingestion)
- Discovery of agents by capability
- Retrieval of agent metadata
- Health monitoring of registered agents

This system is designed to be:
- production-structured
- extensible for future federation and scaling
- deterministic in behavior
- AI-consumable for agent-to-agent discovery

---

# CORE ARCHITECTURE PRINCIPLES

You MUST follow these principles:

- Strict separation of concerns:
  - API layer (FastAPI routes only)
  - Service layer (business logic)
  - Persistence layer (SQLite only)
  - Workers layer (background jobs only)

- No cross-layer logic mixing

- No over-engineering or unnecessary abstractions

- Code must remain readable and maintainable for OSS usage

---

# API CONTRACT (IMMUTABLE)

You MUST implement EXACTLY the following endpoints:

## 1. Register Agent
POST /api/v1/agents

Input:
- { agent_card: object } OR { url: string }

Output:
- { id, status: "registered", normalized: true }

---

## 2. List Agents
GET /api/v1/agents

Optional filters:
- status
- capability

Output:
- { agents: [...], total: number }

---

## 3. Get Agent
GET /api/v1/agents/{agent_id}

Output:
- { agent: object }

---

## 4. Search Agents
GET /api/v1/agents/search?capability=xxx&match=partial|exact

Output:
- { query, results: [...] }

---

## 5. Agent Health
GET /api/v1/agents/{agent_id}/health

Output:
- { status, latency_ms, last_checked }

---

## 6. System Health
GET /api/v1/health

Output:
- { agents_total, healthy, unhealthy, avg_latency_ms }

---

## 7. Refresh Agent
POST /api/v1/agents/{agent_id}/refresh

Output:
- { status, source_refetched }

---

# OBSERVABILITY CONTRACT RULES:

- /api/v1/debug/* is part of system contract but separate from core API
- It MUST NOT affect core API behavior
- It MUST NOT be required for system operation
- It MUST reflect actual runtime state only
- It MUST NOT be used for core business logic

---

# DEBUG DATA SOURCE RULE:

All debug endpoints MUST derive data from:
- database state
- runtime in-memory state
- actual execution traces

DO NOT:
- simulate data
- reconstruct hypothetical states
- infer missing runtime behavior

---

# AGENT CARD MODEL (STRICT)

Each agent MUST conform to:

- id (string, canonical)
- name (string)
- description (string)
- url (string)
- version (string)
- capabilities (string[])
- skills (optional structured list)
- provider (optional)
- source { type, location }
- health { status, latency_ms, last_seen }

---

# CAPABILITY SYSTEM (CRITICAL)

## Normalization Pipeline (MANDATORY)

All capabilities MUST pass through:

1. syntactic normalization:
   - lowercase
   - trim spaces
   - replace "_" and "-" with space

2. canonical mapping using:
   app/core/capabilities_map.py

3. deduplication

---

## STORAGE MODEL

Agents MUST store:

- raw_capabilities
- normalized_capabilities
- canonical_capabilities

---

## CANONICAL CAPABILITY RULES

- All mappings MUST come from capabilities_map.py
- If no match exists → assign "unclassified"
- DO NOT invent new canonical categories dynamically

---

## CAPABILITY MAP STORAGE (IMMUTABLE DESIGN RULE)

- Must exist in: app/core/capabilities_map.py
- Must NOT be embedded in services or API layer
- Must be editable without DB migration
- Must survive backend rebuilds

---

# DATABASE RULES (STRICT)

- ONLY ONE TABLE: agents
- DO NOT introduce additional tables

agents table fields:

- id (TEXT PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- url (TEXT)
- version (TEXT)
- capabilities (TEXT JSON)
- raw_agent_card (TEXT JSON)
- status (TEXT)
- latency_ms (INTEGER)
- last_seen (TEXT)

DO NOT:
- add ORM migrations
- normalize into multiple tables
- introduce relational schema complexity

---

# BACKGROUND WORKERS

- Health check runs in-process (FastAPI background task)
- Executes every 60 seconds
- No external schedulers allowed

DO NOT use:
- Celery
- Redis
- message queues
- external cron containers

---

# DOCKER RULES (IMMUTABLE INFRASTRUCTURE)

- MUST provide:
  - Dockerfile
  - docker-compose.yml

- docker-compose MUST contain ONLY ONE service: backend

- SQLite must persist via volume mount:
  ./data:/app/data

- FastAPI must bind to:
  0.0.0.0:8000

DO NOT:
- modify docker-compose during feature iterations
- add services (Redis, DB containers, etc.)
- move logic into Docker layer

---

# DEPENDENCY RULES

Allowed only:
- fastapi
- uvicorn
- pydantic
- httpx
- sqlite3 (builtin)

DO NOT introduce additional libraries unless explicitly required.

---

# RESPONSE RULES (ANTI-HALLUCINATION GUARANTEE)

- Do NOT add fields outside API contract
- Do NOT change endpoint names
- Do NOT wrap responses in extra envelopes
- Do NOT invent debug metadata
- Do NOT mutate schema dynamically

---

# NAMING RULES

- agent_id is the only canonical identifier
- capabilities are ALWAYS string arrays
- status ∈ {healthy, unhealthy, unknown}
- snake_case everywhere in backend

---

# STRUCTURE RULES

You MUST use EXACT structure:

app/
  main.py
  api/
  services/
  db/
  schemas/
  workers/
  core/

DO NOT:
- add new folders
- introduce layered frameworks
- over-split modules

---

# EXTENSIBILITY RULE

System MUST be designed so future additions are easy:

- authentication layer (future)
- distributed registry (future)
- federation across registries (future)
- observability enhancements (future)

BUT:
DO NOT implement these now.

---

# CRITICAL EXECUTION RULE

The system must:
- run immediately after generation
- be consistent across all layers
- strictly follow API contract
- avoid architectural drift or hallucination

Design a clean production-ready architecture for this system.

Focus on:
- folder structure
- module boundaries
- data flow between API, service, DB, workers
- placement of capability normalization system
- Docker integration layout

Do NOT implement code yet.
Do NOT add extra features beyond specification.
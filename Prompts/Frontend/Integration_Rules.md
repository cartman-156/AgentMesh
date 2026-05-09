Define and enforce the frontend-backend integration contract for AgentMesh.

---

# PURPOSE

Ensure frontend strictly adheres to backend API responses without deviation.

Frontend must NOT:
- guess fields
- transform response structures
- introduce derived schemas
- assume missing backend behavior

---

# REQUIRED OUTPUT

Create a centralized API contract layer:

## 1. API TYPES (MANDATORY)

Define TypeScript interfaces for:

- Agent
- AgentCard
- Capability
- HealthStatus
- DebugAgentState
- SearchResponse

These MUST match backend responses exactly.

No extra fields allowed.

---

## 2. API CLIENT LAYER

Implement:

/frontend/src/api/client.ts

Must include:
- typed wrappers for all /api/v1 endpoints
- strict response typing
- no transformation logic (pass-through only)

---

## 3. RESPONSE CONTRACT RULE

Frontend must treat backend responses as:
- immutable
- authoritative
- source of truth

DO NOT:
- normalize capabilities in frontend
- compute derived fields unless explicitly provided by backend

---

## 4. ERROR CONTRACT

Define standard handling for:
- network errors
- 4xx responses
- 5xx responses

BUT DO NOT hide backend errors or reshape them.

---

## 5. DEBUG CONTRACT INTEGRATION

Frontend must explicitly consume /api/v1/debug/* responses using separate types:

- DebugAgentResponse
- DebugSearchResponse
- DebugHealthResponse

These are read-only and must not affect core UI logic.

---

# CRITICAL RULE

This layer is the ONLY allowed interface between frontend and backend.

All UI must depend on it.
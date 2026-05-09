PROJECT: AgentMesh Frontend

PURPOSE:
Frontend for AgentMesh AI Agent Registry system.

It provides:
- agent discovery UI
- agent registration UI
- capability-based search UI
- system health dashboard
- debug/observability views

---

# ARCHITECTURE RULES

- React-based frontend
- shadcn/ui component system
- TypeScript mandatory
- No backend logic duplication
- No assumptions beyond API contract

---

# BACKEND DEPENDENCY RULE

Frontend MUST ONLY use:

- /api/v1/agents
- /api/v1/agents/search
- /api/v1/health
- /api/v1/debug/*

DO NOT assume any other endpoints exist.

---

# UI MODULES

Frontend must include:

1. Agent Registry Dashboard
2. Agent Detail Page
3. Agent Registration Form
4. Capability Search Interface
5. System Health Dashboard
6. Debug/Observability Viewer

---

# DATA RULE

- All data comes from backend APIs only
- No local mock data except temporary dev fallback
- No duplicated capability logic
- No normalization logic in frontend

---

# STATE RULE

- Use a single state management approach (lightweight preferred)
- Avoid over-engineering (no Redux unless necessary)

---

# EXTENSIBILITY RULE

UI must be structured so future features can be added:

- authentication layer
- agent federation UI
- multi-registry support

BUT DO NOT implement these now.
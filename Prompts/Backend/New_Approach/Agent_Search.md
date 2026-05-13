GLOBAL RULES:
- System_Role.md
- Architecture_Rules.md
- API_Contract.md
- Capability_Rule.md
- Database_Rules.md

TASK:
Implement Agent Search API (name, capability, agent_id filtering).

FILES:
- app/api/routes/agents_search.py
- app/services/agents_search_service.py
- app/schemas/agents_search_schema.py

REQUIREMENTS:
- deterministic search logic
- capability must use canonical mapping
- agent_id must be exact match only
- name supports partial/exact match
- AND semantics for multiple filters
- deregistered agents are excluded by default

DO NOT:
- modify DB schema
- modify other endpoints
- introduce fuzzy ranking

OUTPUT:
Write code directly into files.
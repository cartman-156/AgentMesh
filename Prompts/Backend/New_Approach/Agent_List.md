Follow:
- System_Role.md
- Architecture_Rules.md
- API_Contract.md
- Capability_Rule.md
- Response_Rules.md

Task:
Implement filtering support in GET /api/v1/agents.

Requirements:
- filter by status (healthy/unhealthy)
- filter by capability using canonical capability matching only

Behavior:
- use canonical_capabilities for filtering
- return only matching agents
- preserve existing response structure
- deregistered agents are excluded by default

Constraints:
- deterministic filtering behavior
- no business logic in API routes
- preserve A2A-compatible metadata behavior

Do NOT:
- add pagination unless already implemented
- modify API response schema
- introduce additional query semantics
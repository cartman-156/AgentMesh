Implement filtering support in GET /api/v1/agents.

Requirements:
- filter by status (healthy/unhealthy)
- filter by capability (canonical capability match only)

Behavior:
- use canonical_capabilities for filtering
- return only matching agents
- keep response format unchanged

Do NOT:
- add pagination unless already present
- change response schema
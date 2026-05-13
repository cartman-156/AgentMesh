# RESPONSE RULES

DO NOT:
- add undocumented fields
- mutate response shapes
- expose internal implementation
- add hidden metadata
- dynamically alter schemas

Naming Rules:
- snake_case everywhere
- agent_id is canonical identifier
- capabilities are string arrays
- status ∈ {healthy, unhealthy, unknown}

Responses MUST remain deterministic.
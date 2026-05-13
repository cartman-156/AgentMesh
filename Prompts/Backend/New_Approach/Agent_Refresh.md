Follow:
- System_Role.md
- A2A_Protocol_Rules.md
- API_Contract.md
- Architecture_Rules.md
- Capability_Rule.md
- Database_Rules.md
- Response_Rules.md

Task:
Implement POST /api/v1/agents/{agent_id}/refresh.

Requirements:
- re-fetch Agent Card from stored URL
- validate updated payload against A2A-compatible semantics
- re-run capability normalization pipeline
- update stored agent record

Must:
- preserve existing agent_id
- preserve raw Agent Card payload
- preserve A2A protocol semantics
- update mutable fields only
- maintain interoperability with A2A-compatible registries

Constraints:
- deterministic update behavior
- preserve DB schema
- preserve API contract
- preserve protocol-visible semantics

Do NOT:
- create a new agent entry
- mutate protocol-defined fields
- introduce incompatible schema changes
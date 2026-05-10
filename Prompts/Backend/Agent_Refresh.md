Implement POST /api/v1/agents/{agent_id}/refresh.

Requirements:
- re-fetch Agent Card from stored URL
- validate updated schema against A2A-compatible structure
- re-run normalization pipeline
- update stored agent record

Must:
- preserve existing agent_id
- preserve A2A protocol semantics
- preserve raw agent card payload
- update only mutable fields
- maintain interoperability with A2A-compatible registries

Do NOT:
- create new agent entry
- modify API structure
- mutate protocol-defined fields
- introduce non-A2A-compatible schema changes
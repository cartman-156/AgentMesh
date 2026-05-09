Implement POST /api/v1/agents/{agent_id}/refresh.

Requirements:
- re-fetch Agent Card from stored URL
- validate updated schema
- re-run normalization pipeline
- update stored agent record

Must:
- preserve existing agent_id
- update only mutable fields

Do NOT:
- create new agent entry
- modify API structure
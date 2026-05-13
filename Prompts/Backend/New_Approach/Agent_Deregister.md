# DEREGISTER AGENT

Follow:
- System_Role.md
- Execution_Mode.md
- A2A_Protocol_Rules.md
- API_Contract.md
- Architecture_Rules.md
- Capability_Rule.md
- Database_Rules.md
- Response_Rules.md

Task:
Implement Agent Deregistration.

Requirements:
- support DELETE /api/v1/agents/{agent_id}
- validate agent existence
- operation must be deterministic + idempotent
- deregistered agents must not appear in discovery
- preserve historical registry data
- preserve raw + normalized Agent Card data

Must:
- avoid hard delete behavior
- preserve protocol semantics
- preserve response shape
- maintain SQLite consistency

Constraints:
- no speculative archival features
- no protocol field mutation
- no response wrapping
- no field renaming

Do NOT modify:
- API contract
- response format
- capability normalization
- Agent Card semantics

Execution:
- modify files directly
- no chat output
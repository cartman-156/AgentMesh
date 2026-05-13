# APPROVE AGENT

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
Implement Agent Approval.

Requirements:
- support POST /api/v1/agents/{agent_id}/approve
- validate agent existence
- only registered agents may be approved
- operation must be deterministic + idempotent
- approved agents become discoverable
- preserve raw + normalized Agent Card data

Must:
- preserve protocol semantics
- preserve response shape
- preserve layer separation
- maintain SQLite consistency

Constraints:
- no schema mutation unless required
- no speculative metadata
- no response wrapping
- no protocol reinterpretation
- no field renaming

Do NOT modify:
- API contract
- response format
- capability normalization
- Agent Card semantics

Execution:
- modify files directly
- no chat output
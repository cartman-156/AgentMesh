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
Implement Agent Registration.

Requirements:
- support POST /api/v1/agents
- support:
  1. { agent_card: object }
  2. { url: string }

Behavior:
- if URL provided, fetch .well-known/agent.json
- validate all Agent Cards against A2A-compatible semantics
- normalize capabilities using capability pipeline
- store raw + normalized data in SQLite
- generate deterministic agent_id if missing

Must:
- preserve raw Agent Card structure
- preserve A2A field semantics
- reject invalid payloads deterministically
- maintain interoperability with external A2A registries and agents

Constraints:
- no speculative features
- no schema mutations
- deterministic validation behavior
- strict layer separation

Do NOT modify:
- API contract
- database schema
- response format
- protocol-defined field meanings
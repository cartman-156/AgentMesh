Implement Agent Registration.

Requirements:
- Support POST /api/v1/agents
- Input:
  1. { agent_card: object }
  2. { url: string } → fetch .well-known/agent.json

Behavior:
- If URL provided, fetch and validate JSON
- Validate all Agent Cards against A2A-compatible semantics
- Normalize agent card using capability system
- Store raw + normalized agent data in SQLite
- Generate deterministic agent_id if not provided

Must:
- preserve raw Agent Card structure
- preserve A2A field semantics
- reject invalid A2A-compatible payloads deterministically
- maintain interoperability with external A2A registries and agents

Must NOT modify:
- API contract
- database schema
- response format
- protocol-defined field meanings
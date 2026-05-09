Implement Agent Registration.

Requirements:
- Support POST /api/v1/agents
- Input:
  1. { agent_card: object }
  2. { url: string } → fetch .well-known/agent.json

Behavior:
- If URL provided, fetch and validate JSON
- Normalize agent card using capability system
- Store raw + normalized agent data in SQLite
- Generate deterministic agent_id if not provided

Must NOT modify:
- API contract
- database schema
- response format
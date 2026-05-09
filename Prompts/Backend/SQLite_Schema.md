Implement SQLite schema for AgentMesh.

Requirements:
- single table: agents
- store:
  id (TEXT PRIMARY KEY)
  name
  description
  url
  version
  capabilities (JSON string)
  raw_agent_card (JSON string)
  status
  latency_ms
  last_seen

Must:
- auto-initialize DB on startup
- ensure persistence in /data volume

Do NOT:
- create additional tables
- introduce ORM migrations
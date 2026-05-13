Follow:
- System_Role.md
- Database_Rules.md
- Structure_Rules.md
- Infrastructure_Rules.md

Task:
Implement SQLite schema for AgentMesh.

Requirements:
- single table:
  agents

Fields:
- id (TEXT PRIMARY KEY)
- name
- description
- url
- version
- capabilities (JSON string)
- raw_agent_card (JSON string)
- status
- latency_ms
- last_seen

Must:
- auto-initialize database on startup
- persist DB in /data volume

Constraints:
- SQLite only
- deterministic schema initialization

Do NOT:
- create additional tables
- introduce migrations
- introduce ORM abstractions
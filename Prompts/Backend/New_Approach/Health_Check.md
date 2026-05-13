Follow:
- System_Role.md
- Worker_Rules.md
- A2A_Protocol_Rules.md
- Architecture_Rules.md
- Database_Rules.md
- Response_Rules.md

Task:
Implement agent health monitoring system.

Requirements:
- background worker executes every 60 seconds
- for each agent:
  - call agent.url or health endpoint
  - measure latency_ms
  - update health status
  - update last_seen timestamp

Constraints:
- run inside FastAPI process
- no external schedulers
- no Redis
- no Celery

Must:
- preserve A2A-compatible metadata behavior
- preserve deterministic worker execution

Do NOT modify:
- API response schema
- database structure
Implement agent health monitoring system.

Requirements:
- background worker runs every 60 seconds
- for each agent:
  - call agent.url (or health endpoint if available)
  - measure latency_ms
  - update status (healthy/unhealthy)
  - update last_seen timestamp

Constraints:
- must run inside FastAPI process
- no external schedulers allowed
- no Redis or Celery

Must NOT modify:
- API response schema
- database structure
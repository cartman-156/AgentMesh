# WORKER RULES

Health checks run in-process using FastAPI background tasks.

Execution:
- every 60 seconds
- check agent URL or health endpoint
- measure latency
- update status
- update last_seen

DO NOT use:
- Celery
- Redis
- queues
- distributed schedulers
- cron containers

Workers MUST:
- contain execution logic only
- avoid API responsibilities
- avoid persistence abstractions
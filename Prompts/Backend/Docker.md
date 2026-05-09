Implement Docker setup for AgentMesh.

Requirements:
- Dockerfile for FastAPI app
- docker-compose.yml with single backend service
- expose port 8000
- mount SQLite volume at /app/data

Must:
- system runs with docker compose up

Do NOT:
- add extra services (Redis, DB containers, etc.)
- modify docker-compose after generation phase
Follow:
- System_Role.md
- Infrastructure_Rules.md
- Structure_Rules.md

Task:
Implement Docker setup for AgentMesh.

Requirements:
- create Dockerfile for FastAPI backend
- create docker-compose.yml
- expose port 8000
- mount SQLite volume at /app/data

Must:
- run successfully with docker compose up

Constraints:
- single backend service only
- deterministic container structure

Do NOT:
- add Redis
- add DB containers
- add additional infrastructure services
- mutate compose structure unnecessarily
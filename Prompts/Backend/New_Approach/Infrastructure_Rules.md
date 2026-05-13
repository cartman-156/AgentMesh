# INFRASTRUCTURE RULES

MUST provide:
- Dockerfile
- docker-compose.yml

docker-compose MUST contain ONLY:
- backend service

SQLite persistence:
./data:/app/data

FastAPI binding:
0.0.0.0:8000

DO NOT:
- add infrastructure services
- add Redis
- add DB containers
- mutate compose structure during iterations
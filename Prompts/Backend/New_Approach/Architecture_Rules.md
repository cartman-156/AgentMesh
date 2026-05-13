# ARCHITECTURE RULES

Strict separation of concerns is mandatory.

Layers:
- API layer → routing only
- Service layer → business logic only
- DB layer → SQLite access only
- Workers layer → background execution only

DO NOT:
- mix responsibilities
- place business logic in routes
- place persistence logic in services
- introduce hidden abstractions
- introduce plugin systems
- introduce dependency injection frameworks
- over-engineer module boundaries

Favor:
- explicit logic
- readability
- deterministic flow
- maintainability
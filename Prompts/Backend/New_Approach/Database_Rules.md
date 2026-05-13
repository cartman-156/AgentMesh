# DATABASE RULES

SQLite only.

ONLY ONE TABLE:
- agents

Schema:

- id (TEXT PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- url (TEXT)
- version (TEXT)
- capabilities (TEXT JSON)
- raw_agent_card (TEXT JSON)
- status (TEXT)
- latency_ms (INTEGER)
- last_seen (TEXT)

DO NOT:
- add additional tables
- introduce migrations
- normalize schema
- introduce ORM complexity
- introduce relational abstractions

DB layer MUST contain persistence logic only.
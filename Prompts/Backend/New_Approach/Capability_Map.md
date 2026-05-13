Follow:
- System_Role.md
- Architecture_Rules.md
- Capability_Rule.md
- Structure_Rules.md

Task:
Create and integrate capability mapping system.

Requirements:
- create app/core/capabilities_map.py
- include canonical capability dictionary:
  weather
  finance
  travel
  observability
  infrastructure
  ai_ml
  general

Behavior:
- make mapping importable by services layer
- use as canonical capability source

Must:
- remain editable without DB changes
- remain single source of truth

Constraints:
- deterministic canonical mapping
- explicit mapping behavior only

Do NOT:
- duplicate mappings in services or API layer
- store mappings in database
- output explanation unless necessary
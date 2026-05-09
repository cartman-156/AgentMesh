Create and integrate capability mapping system.

Requirements:
- create app/core/capabilities_map.py
- include canonical capability dictionary (weather, finance, travel, observability, infrastructure, ai_ml, general)
- make it importable by services layer

Must:
- be editable without DB changes
- be single source of truth

Do NOT:
- duplicate map in services or API layer
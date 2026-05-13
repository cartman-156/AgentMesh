Follow:
- System_Role.md
- Architecture_Rules.md
- Structure_Rules.md
- Response_Rules.md

Task:
Incrementally update existing documentation for newly implemented lifecycle operations only.

Scope:
- approve
- reject
- deregister
- lifecycle-aware discovery behavior

Critical Rules:
- inspect actual implementation only
- update existing docs only where required
- do NOT regenerate unrelated sections
- do NOT rewrite stable documentation
- do NOT invent undocumented behavior

Required Updates:

1. architecture.md
Update only:
- lifecycle state handling
- approval/rejection flow
- deregistration behavior
- persistence behavior changes
- API route additions
- discovery/list/search lifecycle filtering
- Mermaid diagrams impacted by lifecycle logic

2. sequence/
Update or add only required diagrams for:
- approval flow
- rejection flow
- deregistration flow

Requirements:
- Mermaid syntax only
- diagrams must reflect actual runtime behavior
- rejected agents must reflect hard-delete behavior if implemented
- deregistered agents must reflect retained lifecycle state if implemented

Before updating:
- inspect modified routes
- inspect service layer changes
- inspect DB changes
- inspect lifecycle logic
- inspect tests for actual behavior

Constraints:
- markdown only
- preserve existing file structure
- preserve existing documentation formatting style
- no prose outside generated docs

Execution:
- modify docs directly
- no chat output
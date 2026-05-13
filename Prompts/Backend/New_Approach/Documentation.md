Follow:
- System_Role.md
- Architecture_Rules.md
- Structure_Rules.md
- Response_Rules.md

Task:
Generate system documentation for the implemented AgentMesh backend by analyzing the actual codebase only.

Critical Rules:
- inspect real implementation only
- do NOT infer missing architecture
- do NOT invent undocumented components
- documentation must reflect actual runtime structure

Output Structure:

/docs
  architecture.md
  sequence/
    agent_registration.md
    agent_search.md
    health_check.md
    refresh_flow.md

Requirements:

1. architecture.md
- actual implemented architecture
- module breakdown
- API structure
- service interactions
- SQLite schema
- worker design
- capability normalization flow
- Mermaid component + data flow diagrams

2. Sequence diagrams
Generate Mermaid sequence diagrams for:
- agent registration
- capability search
- health checks
- refresh flow

Constraints:
- Mermaid syntax only
- no hypothetical components
- diagrams must match actual code

Before generating:
- inspect API routes
- inspect services
- inspect DB layer
- inspect workers
- inspect capability pipeline

Output Style:
- Markdown only
- self-contained files
- no prose outside generated docs
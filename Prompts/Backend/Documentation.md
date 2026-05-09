Generate system documentation for the completed AgentMesh backend by analyzing the actual codebase.

CRITICAL RULE:
- You MUST inspect and derive everything from existing code only.
- DO NOT assume architecture from design intent or prompts.
- DO NOT invent missing components.

---

# OUTPUT REQUIREMENTS

Create documentation inside a /docs folder with the following structure:

/docs
  architecture.md
  sequence/
    agent_registration.md
    agent_search.md
    health_check.md
    refresh_flow.md

---

# 1. ARCHITECTURE DOCUMENT (architecture.md)

Must include:

- actual system architecture based on code
- module breakdown (as implemented, not planned)
- API layer structure
- service layer interactions
- database schema (as implemented)
- worker/background system design
- capability normalization flow

Include a **diagram in Mermaid format**:

- system component diagram
- data flow between components

---

# 2. SEQUENCE DIAGRAMS

For each major flow, generate a sequence diagram in Markdown using Mermaid:

## Required flows:

### 1. Agent Registration Flow
- JSON upload path
- URL ingestion path (.well-known fetch)

### 2. Capability Search Flow
- query input → normalization → canonical mapping → DB lookup → response

### 3. Health Check Flow
- worker trigger → agent call → latency measurement → DB update

### 4. Refresh Flow
- refresh request → fetch remote agent card → validate → update DB

---

# 3. DIAGRAM RULES

- Use Mermaid syntax only
- Keep diagrams accurate to implemented code
- Do NOT include hypothetical components
- Do NOT include missing or unimplemented features
- Keep diagrams minimal and readable

---

# 4. CODE-AWARE GENERATION RULE

Before writing any documentation:

- scan API routes
- scan services layer
- scan DB schema
- scan workers
- scan capability normalization logic

All outputs MUST reflect actual implementation.

---

# 5. OUTPUT STYLE

- Markdown only
- No prose explanations outside documentation files
- Each file must be self-contained and readable independently
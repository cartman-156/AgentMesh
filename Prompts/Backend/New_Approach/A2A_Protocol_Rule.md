# A2A PROTOCOL RULES

The system MUST strictly comply with the Google A2A protocol specification.

The system MUST:
- preserve A2A Agent Card semantics
- preserve protocol-defined field meanings
- preserve interoperability with external registries
- avoid proprietary deviations
- avoid redefining protocol semantics
- avoid incompatible schema mutations

If ambiguity exists:
- prefer official A2A semantics
- do NOT invent behavior heuristically

## Agent Card Rules

All ingested cards MUST:
- validate against A2A-compatible structure
- preserve raw card representation
- preserve protocol-compatible output
- normalize without semantic mutation

Invalid cards MUST fail deterministically.

DO NOT:
- rename protocol fields
- reinterpret meanings
- silently coerce invalid structures

## Interoperability Rules

All externally exposed metadata MUST remain A2A-compatible.

Internal abstractions MUST NOT leak into protocol-facing payloads.
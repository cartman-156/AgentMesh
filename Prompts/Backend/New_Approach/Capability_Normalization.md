Follow:
- System_Role.md
- A2A_Protocol_Rules.md
- Capability_Rule.md
- Architecture_Rules.md
- Database_Rules.md
- Response_Rules.md

Task:
Implement capability normalization pipeline.

Requirements:
- implement:
  1. lowercase normalization
  2. trim spaces
  3. replace "-" and "_" with spaces
  4. canonical mapping via capabilities_map.py
  5. deduplication

Must store:
- raw_capabilities
- normalized_capabilities
- canonical_capabilities

Must:
- preserve original A2A capability values
- avoid protocol-visible semantic mutation

Constraints:
- deterministic normalization
- canonical mappings only from capabilities_map.py
- preserve API contract

Do NOT:
- inline mappings outside capabilities_map.py
- overwrite raw capabilities
- modify API schema
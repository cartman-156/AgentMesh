Implement capability normalization pipeline.

Requirements:
- implement 3-step pipeline:
  1. syntactic normalization (lowercase, trim, replace -/_)
  2. canonical mapping via capabilities_map.py
  3. deduplication

Must:
- store all three layers:
  raw_capabilities
  normalized_capabilities
  canonical_capabilities
- preserve original A2A capability values in raw storage
- avoid mutating protocol-visible semantics

Do NOT:
- inline capability mapping anywhere except capabilities_map.py
- modify API contract
- overwrite original raw capabilities
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

Do NOT:
- inline capability mapping anywhere except capabilities_map.py
- modify API contract
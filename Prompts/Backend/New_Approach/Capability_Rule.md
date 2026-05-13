# CAPABILITY RULES

All capabilities MUST pass through:

1. lowercase
2. trim spaces
3. replace "_" and "-" with spaces
4. canonical mapping
5. deduplication

Canonical mappings MUST come from:
- app/core/capabilities_map.py

If no mapping exists:
- assign "unclassified"

Agents MUST store:
- raw_capabilities
- normalized_capabilities
- canonical_capabilities

DO NOT:
- dynamically invent categories
- embed mappings in services
- place mappings in DB

capabilities_map.py MUST remain editable without migrations.
from typing import TypedDict
from app.core.capabilities_map import get_canonical

class NormalizedCapabilitiesResult(TypedDict):
    raw_capabilities: list[str]
    normalized_capabilities: list[str]
    canonical_capabilities: list[str]

def normalize_capabilities(raw_capabilities: list[str]) -> NormalizedCapabilitiesResult:
    """
    Normalizes a list of raw capabilities according to the pipeline:
    1. lowercase
    2. trim spaces
    3. replace "-" and "_" with spaces
    4. canonical mapping via capabilities_map.py
    5. deduplication
    """
    normalized_capabilities = []
    canonical_capabilities = []
    
    seen_normalized = set()
    seen_canonical = set()
    
    for raw in raw_capabilities:
        if not isinstance(raw, str):
            continue
            
        # 1. lowercase, 2. trim spaces, 3. replace "-" and "_" with spaces
        normalized = raw.lower().strip().replace("-", " ").replace("_", " ")
        
        if normalized not in seen_normalized:
            seen_normalized.add(normalized)
            normalized_capabilities.append(normalized)
            
        # 4. canonical mapping
        canonical = get_canonical(normalized)
        
        if canonical not in seen_canonical:
            seen_canonical.add(canonical)
            canonical_capabilities.append(canonical)
            
    return {
        "raw_capabilities": raw_capabilities,
        "normalized_capabilities": normalized_capabilities,
        "canonical_capabilities": canonical_capabilities,
    }

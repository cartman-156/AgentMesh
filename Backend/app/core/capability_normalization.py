from typing import TypedDict, Any
from app.core.capabilities_map import get_canonical

class NormalizedCapabilitiesResult(TypedDict):
    raw_capabilities: Any
    normalized_capabilities: list[str]
    canonical_capabilities: list[str]

def normalize_capabilities(raw_capabilities: Any) -> NormalizedCapabilitiesResult:
    """
    Normalizes a list of raw capabilities or a dictionary of booleans according to the pipeline:
    1. Extract True keys if dict, otherwise use list
    2. lowercase
    3. trim spaces
    4. replace "-" and "_" with spaces
    5. canonical mapping via capabilities_map.py
    6. deduplication
    """
    normalized_capabilities = []
    canonical_capabilities = []
    
    # Handle dictionary of booleans
    if isinstance(raw_capabilities, dict):
        base_list = [k for k, v in raw_capabilities.items() if v is True]
    elif isinstance(raw_capabilities, list):
        base_list = raw_capabilities
    else:
        base_list = []

    seen_normalized = set()
    seen_canonical = set()
    
    for raw in base_list:
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

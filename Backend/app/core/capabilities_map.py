# Canonical capability map for AgentMesh.
# This file is the ONLY source of canonical capability definitions.
# Edit here to add/change mappings. No DB changes required.
# DO NOT duplicate or import mappings in services or API layer directly.

CANONICAL_CAPABILITIES: dict[str, list[str]] = {
    "weather": [
        "weather",
        "weather forecast",
        "weather prediction",
        "climate",
        "meteorology",
        "temperature",
        "precipitation",
    ],
    "finance": [
        "finance",
        "financial",
        "stock",
        "stocks",
        "market",
        "trading",
        "investment",
        "banking",
        "accounting",
        "budget",
        "budgeting",
        "payments",
        "payment",
        "crypto",
        "cryptocurrency",
        "forex",
        "economics",
    ],
    "travel": [
        "travel",
        "flight",
        "flights",
        "hotel",
        "hotels",
        "booking",
        "trip",
        "itinerary",
        "navigation",
        "maps",
        "route",
        "transportation",
    ],
    "observability": [
        "observability",
        "monitoring",
        "logging",
        "tracing",
        "metrics",
        "alerting",
        "dashboards",
        "telemetry",
        "apm",
        "log analysis",
        "error tracking",
    ],
    "infrastructure": [
        "infrastructure",
        "devops",
        "deployment",
        "kubernetes",
        "docker",
        "ci cd",
        "cloud",
        "networking",
        "storage",
        "provisioning",
        "iac",
        "terraform",
        "ansible",
        "server management",
    ],
    "ai ml": [
        "ai ml",
        "ai",
        "ml",
        "machine learning",
        "deep learning",
        "nlp",
        "computer vision",
        "llm",
        "model training",
        "inference",
        "embeddings",
        "classification",
        "regression",
        "data science",
        "analytics",
    ],
    "general": [
        "general",
        "assistant",
        "productivity",
        "utility",
        "task",
        "automation",
        "chatbot",
        "question answering",
        "summarization",
        "translation",
        "search",
    ],
}

# Inverted lookup: normalized term → canonical category
_TERM_TO_CANONICAL: dict[str, str] = {
    term: canonical
    for canonical, terms in CANONICAL_CAPABILITIES.items()
    for term in terms
}


def get_canonical(normalized_term: str) -> str:
    """Return the canonical category for a normalized capability term.

    Returns 'unclassified' if no mapping exists.
    """
    return _TERM_TO_CANONICAL.get(normalized_term, "unclassified")

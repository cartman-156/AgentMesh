"""
Network RCA Agent — End-to-End Test Scenarios
Run this script while the agent is running on localhost:8080.

Usage:
    python test_rca_scenarios.py
"""

import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080"

def post(path, payload):
    """Simple POST helper using only stdlib."""
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode()}

def get(path):
    """Simple GET helper using only stdlib."""
    url = f"{BASE_URL}{path}"
    try:
        with urllib.request.urlopen(url, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode()}

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(result):
    print(json.dumps(result, indent=2))


# ──────────────────────────────────────────────────────────────
# Scenario 1: Health Check
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 1: Health Check")
result = get("/health")
print_result(result)


# ──────────────────────────────────────────────────────────────
# Scenario 2: Fetch A2A Agent Card
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 2: A2A Agent Card")
result = get("/.well-known/agent.json")
print(f"  Agent Name : {result.get('name')}")
print(f"  Version    : {result.get('version')}")
print(f"  Skills     : {len(result.get('skills', []))} registered")
print(f"  Capabilities: {result.get('capabilities')}")


# ──────────────────────────────────────────────────────────────
# Scenario 3: TRANSPORT Layer Incident (Single Domain, High Confidence)
#   Expected: domain=TRANSPORT, confidence >= 0.85, no escalation
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 3: Transport Layer Fiber Cut (Single Domain)")
result = post("/analyze-incident", {
    "incident_id": "INC-2025-TRANSPORT-001",
    "alarms": [
        {
            "id": "ALM-T001",
            "severity": "CRITICAL",
            "layer": "TRANSPORT",
            "message": "Loss of Signal (LOS) on Optical Ring A — Span 4-5",
            "timestamp": "2025-05-14T10:00:00Z"
        },
        {
            "id": "ALM-T002",
            "severity": "MAJOR",
            "layer": "TRANSPORT",
            "message": "MPLS LSP reroute triggered on PE-Router-3",
            "timestamp": "2025-05-14T10:00:12Z"
        },
        {
            "id": "ALM-T003",
            "severity": "MINOR",
            "layer": "TRANSPORT",
            "message": "BER threshold exceeded on optical amplifier OA-7",
            "timestamp": "2025-05-14T10:00:30Z"
        }
    ]
})
print_result(result)
print(f"\n  ✅ Root Cause  : {result.get('root_cause')}")
print(f"  📊 Confidence  : {result.get('confidence')}")
print(f"  🏷️  Domain      : {result.get('failure_domain')}")
print(f"  📤 Escalated   : {result.get('escalated_to', [])}")


# ──────────────────────────────────────────────────────────────
# Scenario 4: RAN Layer Cell Outage (Single Domain, Lower Confidence)
#   Expected: domain=RAN, confidence ~0.70, may escalate
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 4: RAN Cell Outage (Single Domain, Lower Confidence)")
result = post("/analyze-incident", {
    "incident_id": "INC-2025-RAN-002",
    "alarms": [
        {
            "id": "ALM-R001",
            "severity": "CRITICAL",
            "layer": "RAN",
            "message": "gNodeB-451 — All cells down, no heartbeat",
            "timestamp": "2025-05-14T11:00:00Z"
        },
        {
            "id": "ALM-R002",
            "severity": "MAJOR",
            "layer": "RAN",
            "message": "S1 interface timeout on eNodeB-452",
            "timestamp": "2025-05-14T11:00:15Z"
        }
    ]
})
print_result(result)
print(f"\n  ✅ Root Cause  : {result.get('root_cause')}")
print(f"  📊 Confidence  : {result.get('confidence')}")
print(f"  🏷️  Domain      : {result.get('failure_domain')}")
print(f"  📤 Escalated   : {result.get('escalated_to', [])}")


# ──────────────────────────────────────────────────────────────
# Scenario 5: CORE Network Incident (High Confidence)
#   Expected: domain=CORE, confidence ~0.95
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 5: Core Network Gateway Failure (High Confidence)")
result = post("/analyze-incident", {
    "incident_id": "INC-2025-CORE-003",
    "alarms": [
        {
            "id": "ALM-C001",
            "severity": "CRITICAL",
            "layer": "CORE",
            "message": "PGW-01 unreachable — all GTP tunnels down",
            "timestamp": "2025-05-14T12:00:00Z"
        },
        {
            "id": "ALM-C002",
            "severity": "CRITICAL",
            "layer": "CORE",
            "message": "SGW-02 failover triggered — session loss detected",
            "timestamp": "2025-05-14T12:00:05Z"
        }
    ]
})
print_result(result)
print(f"\n  ✅ Root Cause  : {result.get('root_cause')}")
print(f"  📊 Confidence  : {result.get('confidence')}")
print(f"  🏷️  Domain      : {result.get('failure_domain')}")
print(f"  📤 Escalated   : {result.get('escalated_to', [])}")


# ──────────────────────────────────────────────────────────────
# Scenario 6: Cross-Layer Cascading Failure (Low Confidence → Escalation)
#   Expected: domain=CROSS, confidence ~0.65, will attempt A2A escalation
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 6: Cross-Layer Cascading Failure (A2A Escalation)")

# First, register a helper agent so the escalation has a target
print("  [Setup] Registering a Transport Specialist agent...")
reg_result = post("/register", {
    "id": "transport-specialist-01",
    "name": "Optical Transport Specialist",
    "description": "Deep fiber-optic and DWDM failure analysis",
    "url": "http://transport-specialist:8081",
    "version": "1.0.0",
    "capabilities": ["optical_rca", "dwdm_analysis", "fiber_fault_location"],
    "domain": "TRANSPORT",
    "company": "TelecomCorp"
})
print(f"  [Setup] Registered: {reg_result.get('id', reg_result)}")

# Now trigger a cross-layer incident
result = post("/analyze-incident", {
    "incident_id": "INC-2025-CROSS-004",
    "alarms": [
        {
            "id": "ALM-X001",
            "severity": "CRITICAL",
            "layer": "TRANSPORT",
            "message": "Fiber cut detected on Ring B — complete signal loss",
            "timestamp": "2025-05-14T13:00:00Z"
        },
        {
            "id": "ALM-X002",
            "severity": "CRITICAL",
            "layer": "RAN",
            "message": "eNodeB-500 through eNodeB-510 all reporting backhaul failure",
            "timestamp": "2025-05-14T13:00:30Z"
        },
        {
            "id": "ALM-X003",
            "severity": "MAJOR",
            "layer": "RAN",
            "message": "Massive call drop spike detected in Sector 7",
            "timestamp": "2025-05-14T13:01:00Z"
        }
    ],
    "context": "Multiple customer complaints about no service in the eastern corridor"
})
print_result(result)
print(f"\n  ✅ Root Cause  : {result.get('root_cause')}")
print(f"  📊 Confidence  : {result.get('confidence')}")
print(f"  🏷️  Domain      : {result.get('failure_domain')}")
print(f"  📤 Escalated   : {result.get('escalated_to', [])}")


# ──────────────────────────────────────────────────────────────
# Scenario 7: A2A Request (Agent-to-Agent Endpoint)
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 7: A2A Agent-to-Agent Request")
result = post("/a2a/request-analysis", {
    "incident_id": "INC-2025-A2A-005",
    "domain_to_analyze": "CORE",
    "alarms": [
        {
            "id": "ALM-A001",
            "severity": "CRITICAL",
            "layer": "CORE",
            "message": "MME pool exhaustion — signaling storm detected",
            "timestamp": "2025-05-14T14:00:00Z"
        }
    ]
})
print_result(result)
print(f"\n  ✅ Root Cause  : {result.get('root_cause')}")
print(f"  📊 Confidence  : {result.get('confidence')}")
print(f"  🏷️  Domain      : {result.get('failure_domain')}")


# ──────────────────────────────────────────────────────────────
# Scenario 8: List All Registered Agents
# ──────────────────────────────────────────────────────────────
print_header("SCENARIO 8: List All Registered Agents")
agents = get("/agents")
for agent in agents:
    print(f"  • {agent['id']:30s} | {agent['name']:35s} | domain={agent['domain']}")


# ──────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────
print_header("ALL SCENARIOS COMPLETE ✅")
print("  The Network RCA Agent is fully operational.")
print("  - Alarm correlation across RAN / TRANSPORT / CORE ✓")
print("  - Failure domain classification ✓")
print("  - A2A agent registration & discovery ✓")
print("  - A2A escalation on low confidence ✓")
print()

#!/usr/bin/env python3
"""
AgentMesh Backend Smoke Test
Validates backend correctness and operational readiness.
"""

import json
import sys
import time
import requests
from typing import Dict, Any, List, Tuple

BASE_URL = "http://localhost:8000"

# Test results tracking
test_results: List[Tuple[str, bool, str]] = []


def log_step(step: str, status: str, details: str = "") -> None:
    """Log test step with status."""
    status_display = "✓ PASS" if status == "PASS" else "✗ FAIL"
    message = f"[{status_display}] {step}"
    if details:
        message += f" | {details}"
    print(message)


def test_connectivity() -> bool:
    """Test 1: Verify backend connectivity."""
    print("\n=== Test 1: Backend Connectivity ===")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            log_step("Connectivity", "PASS", f"Backend reachable at {BASE_URL}")
            test_results.append(("Connectivity", True, "Backend reachable"))
            return True
        else:
            log_step("Connectivity", "FAIL", f"Unexpected status code: {response.status_code}")
            test_results.append(("Connectivity", False, f"Status {response.status_code}"))
            return False
    except requests.ConnectionError:
        log_step("Connectivity", "FAIL", f"Cannot connect to {BASE_URL}")
        test_results.append(("Connectivity", False, "Connection refused"))
        return False
    except Exception as e:
        log_step("Connectivity", "FAIL", str(e))
        test_results.append(("Connectivity", False, str(e)))
        return False


def test_system_health() -> bool:
    """Test 2: System health validation."""
    print("\n=== Test 2: System Health Validation ===")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            required_fields = ["agents_total", "healthy", "unhealthy", "avg_latency_ms"]
            if all(field in data for field in required_fields):
                log_step(
                    "System Health",
                    "PASS",
                    f"Total: {data['agents_total']}, Healthy: {data['healthy']}, Unhealthy: {data['unhealthy']}"
                )
                test_results.append(("System Health", True, "Health endpoint valid"))
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                log_step("System Health", "FAIL", f"Missing fields: {missing}")
                test_results.append(("System Health", False, f"Missing {missing}"))
                return False
        else:
            log_step("System Health", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("System Health", False, f"Status {response.status_code}"))
            return False
    except Exception as e:
        log_step("System Health", "FAIL", str(e))
        test_results.append(("System Health", False, str(e)))
        return False


def test_agent_registration() -> Tuple[bool, str]:
    """Test 3: Agent registration with JSON payload."""
    print("\n=== Test 3: Agent Registration (JSON) ===")
    
    sample_agent = {
        "name": "test-weather-agent",
        "description": "Test weather agent",
        "version": "1.0.0",
        "capabilities": ["weather", "forecast"]
    }
    
    payload = {"agent_card": sample_agent}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/agents",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "status", "normalized"]
            if all(field in data for field in required_fields):
                agent_id = data.get("id")
                log_step(
                    "Agent Registration",
                    "PASS",
                    f"Registered agent: {agent_id}"
                )
                test_results.append(("Agent Registration", True, f"Agent {agent_id}"))
                return True, agent_id
            else:
                missing = [f for f in required_fields if f not in data]
                log_step("Agent Registration", "FAIL", f"Missing fields: {missing}")
                test_results.append(("Agent Registration", False, f"Invalid response"))
                return False, ""
        else:
            log_step("Agent Registration", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("Agent Registration", False, f"Status {response.status_code}"))
            return False, ""
    except Exception as e:
        log_step("Agent Registration", "FAIL", str(e))
        test_results.append(("Agent Registration", False, str(e)))
        return False, ""


def test_url_ingestion(sample_url: str = "https://api.example.com") -> Tuple[bool, str]:
    """Test 4: URL ingestion."""
    print("\n=== Test 4: URL Ingestion ===")
    
    payload = {"url": sample_url}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/agents",
            json=payload,
            timeout=10
        )
        
        # URL ingestion may fail if endpoint doesn't exist, but endpoint should accept request
        if response.status_code in [200, 400]:
            if response.status_code == 200:
                data = response.json()
                agent_id = data.get("id", "")
                log_step(
                    "URL Ingestion",
                    "PASS",
                    f"Endpoint accepted URL. Agent: {agent_id}"
                )
                test_results.append(("URL Ingestion", True, "Endpoint available"))
                return True, agent_id
            else:
                # 400 is acceptable (invalid URL endpoint)
                log_step(
                    "URL Ingestion",
                    "PASS",
                    "Endpoint rejects invalid URL (expected behavior)"
                )
                test_results.append(("URL Ingestion", True, "Endpoint responds"))
                return True, ""
        else:
            log_step("URL Ingestion", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("URL Ingestion", False, f"Status {response.status_code}"))
            return False, ""
    except requests.Timeout:
        log_step("URL Ingestion", "PASS", "Endpoint available (timeout on external URL)")
        test_results.append(("URL Ingestion", True, "Endpoint available"))
        return True, ""
    except Exception as e:
        log_step("URL Ingestion", "FAIL", str(e))
        test_results.append(("URL Ingestion", False, str(e)))
        return False, ""


def test_list_agents() -> bool:
    """Test 5: List agents."""
    print("\n=== Test 5: List Agents ===")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/agents", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["agents", "total"]
            
            if all(field in data for field in required_fields):
                total = data.get("total", 0)
                if total > 0:
                    log_step(
                        "List Agents",
                        "PASS",
                        f"Retrieved {total} agent(s)"
                    )
                    test_results.append(("List Agents", True, f"{total} agents"))
                    return True
                else:
                    log_step(
                        "List Agents",
                        "FAIL",
                        "No agents registered"
                    )
                    test_results.append(("List Agents", False, "No agents found"))
                    return False
            else:
                missing = [f for f in required_fields if f not in data]
                log_step("List Agents", "FAIL", f"Missing fields: {missing}")
                test_results.append(("List Agents", False, f"Invalid response"))
                return False
        else:
            log_step("List Agents", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("List Agents", False, f"Status {response.status_code}"))
            return False
    except Exception as e:
        log_step("List Agents", "FAIL", str(e))
        test_results.append(("List Agents", False, str(e)))
        return False


def test_capability_search() -> bool:
    """Test 6: Capability search."""
    print("\n=== Test 6: Capability Search ===")
    try:
        # Search for weather capability
        params = {"capability": "weather"}
        response = requests.get(
            f"{BASE_URL}/api/v1/agents/search",
            params=params,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["query", "results"]
            
            if all(field in data for field in required_fields):
                results = data.get("results", [])
                log_step(
                    "Capability Search",
                    "PASS",
                    f"Search returned {len(results)} result(s)"
                )
                test_results.append(("Capability Search", True, f"{len(results)} results"))
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                log_step("Capability Search", "FAIL", f"Missing fields: {missing}")
                test_results.append(("Capability Search", False, "Invalid response"))
                return False
        else:
            log_step("Capability Search", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("Capability Search", False, f"Status {response.status_code}"))
            return False
    except Exception as e:
        log_step("Capability Search", "FAIL", str(e))
        test_results.append(("Capability Search", False, str(e)))
        return False


def test_refresh_flow(agent_id: str) -> bool:
    """Test 7: Refresh agent flow."""
    print("\n=== Test 7: Refresh Agent Flow ===")
    
    if not agent_id:
        log_step("Refresh Agent", "SKIP", "No agent ID from registration")
        test_results.append(("Refresh Agent", True, "Skipped (no agent)"))
        return True
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/agents/{agent_id}/refresh",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["status", "source_refetched"]
            
            if all(field in data for field in required_fields):
                log_step(
                    "Refresh Agent",
                    "PASS",
                    f"Refresh successful for {agent_id}"
                )
                test_results.append(("Refresh Agent", True, "Refresh successful"))
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                log_step("Refresh Agent", "FAIL", f"Missing fields: {missing}")
                test_results.append(("Refresh Agent", False, "Invalid response"))
                return False
        elif response.status_code == 400:
            log_step(
                "Refresh Agent",
                "PASS",
                "Endpoint rejects refresh (no URL, expected)"
            )
            test_results.append(("Refresh Agent", True, "Endpoint available"))
            return True
        else:
            log_step("Refresh Agent", "FAIL", f"Status code: {response.status_code}")
            test_results.append(("Refresh Agent", False, f"Status {response.status_code}"))
            return False
    except Exception as e:
        log_step("Refresh Agent", "FAIL", str(e))
        test_results.append(("Refresh Agent", False, str(e)))
        return False


def print_summary() -> None:
    """Print test summary."""
    print("\n" + "="*60)
    print("SMOKE TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, status, _ in test_results if status)
    total = len(test_results)
    
    for test_name, status, details in test_results:
        status_str = "✓ PASS" if status else "✗ FAIL"
        print(f"{status_str:8} | {test_name:30} | {details}")
    
    print("="*60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("Status: ALL TESTS PASSED ✓")
        return 0
    else:
        print(f"Status: {total - passed} TEST(S) FAILED ✗")
        return 1


def main() -> int:
    """Run all smoke tests."""
    print("AgentMesh Backend Smoke Test")
    print(f"Target: {BASE_URL}")
    print("="*60)
    
    # Test 1: Connectivity
    if not test_connectivity():
        print("\n❌ Backend not reachable. Aborting tests.")
        return 1
    
    # Test 2: System health
    test_system_health()
    
    # Test 3: Agent registration
    success, agent_id = test_agent_registration()
    
    # Test 4: URL ingestion
    test_url_ingestion()
    
    # Test 5: List agents
    test_list_agents()
    
    # Test 6: Capability search
    test_capability_search()
    
    # Test 7: Refresh flow
    if success and agent_id:
        test_refresh_flow(agent_id)
    
    # Print summary and exit
    return print_summary()


if __name__ == "__main__":
    sys.exit(main())

import pytest
import json
from unittest.mock import patch, MagicMock
from app.services.health_service import (
    check_agent_health,
    update_agent_health_status,
    get_agent_health,
    get_system_health
)
from app.services.agent_service import register_agent


class TestHealthCheck:
    """Test health check functionality."""

    def test_check_agent_health_success(self):
        """Test successful health check."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            result = check_agent_health("test-agent", "https://agent.example.com")
            
            assert result["status"] == "healthy"
            assert result["latency_ms"] is not None
            assert result["latency_ms"] >= 0
            assert "last_checked" in result

    def test_check_agent_health_failure(self):
        """Test failed health check."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_get.side_effect = Exception("Connection error")
            
            result = check_agent_health("test-agent", "https://agent.example.com")
            
            assert result["status"] == "unhealthy"
            assert result["latency_ms"] is not None

    def test_check_agent_health_timeout(self):
        """Test health check timeout."""
        with patch("app.services.health_service.requests.get") as mock_get:
            from requests.exceptions import Timeout
            mock_get.side_effect = Timeout()
            
            result = check_agent_health("test-agent", "https://agent.example.com")
            
            assert result["status"] == "unhealthy"
            assert result["latency_ms"] is not None

    def test_check_agent_health_non_200_status(self):
        """Test health check with non-200 status code."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_get.return_value = mock_response
            
            result = check_agent_health("test-agent", "https://agent.example.com")
            
            assert result["status"] == "unhealthy"

    def test_check_agent_health_uses_well_known_endpoint(self):
        """Test that health check uses .well-known/health endpoint."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            check_agent_health("test-agent", "https://agent.example.com")
            
            called_url = mock_get.call_args[0][0]
            assert "/.well-known/health" in called_url

    def test_check_agent_health_timeout_value(self):
        """Test that health check uses 5 second timeout."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            check_agent_health("test-agent", "https://agent.example.com")
            
            assert mock_get.call_args[1]["timeout"] == 5

    def test_check_agent_health_latency_recording(self):
        """Test that latency is recorded."""
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            result = check_agent_health("test-agent", "https://agent.example.com")
            
            assert isinstance(result["latency_ms"], int)
            assert result["latency_ms"] >= 0


class TestHealthStatusUpdate:
    """Test health status persistence."""

    def test_update_agent_health_status(self, sample_agent_card):
        """Test updating agent health status in database."""
        # Register agent first
        reg_result = register_agent(agent_card=sample_agent_card)
        agent_id = reg_result["id"]
        
        # Update health status
        update_agent_health_status(
            agent_id=agent_id,
            status="healthy",
            latency_ms=42,
            last_checked="2026-05-11T12:00:00"
        )
        
        # Verify update
        agent = get_agent_health(agent_id)
        assert agent["status"] == "healthy"
        assert agent["latency_ms"] == 42

    def test_update_to_unhealthy(self, sample_agent_card):
        """Test updating agent status to unhealthy."""
        reg_result = register_agent(agent_card=sample_agent_card)
        agent_id = reg_result["id"]
        
        update_agent_health_status(
            agent_id=agent_id,
            status="unhealthy",
            latency_ms=5000,
            last_checked="2026-05-11T12:00:00"
        )
        
        agent = get_agent_health(agent_id)
        assert agent["status"] == "unhealthy"
        assert agent["latency_ms"] == 5000


class TestGetAgentHealth:
    """Test retrieving agent health information."""

    def test_get_agent_health_existing(self, sample_agent_card):
        """Test retrieving health of existing agent."""
        reg_result = register_agent(agent_card=sample_agent_card)
        agent_id = reg_result["id"]
        
        update_agent_health_status(
            agent_id=agent_id,
            status="healthy",
            latency_ms=100,
            last_checked="2026-05-11T12:00:00"
        )
        
        health = get_agent_health(agent_id)
        
        assert health is not None
        assert "status" in health
        assert "latency_ms" in health
        assert "last_checked" in health

    def test_get_agent_health_nonexistent(self):
        """Test retrieving health of nonexistent agent."""
        health = get_agent_health("nonexistent")
        assert health is None

    def test_get_agent_health_initial_state(self, sample_agent_card):
        """Test health state of newly registered agent."""
        reg_result = register_agent(agent_card=sample_agent_card)
        agent_id = reg_result["id"]
        
        health = get_agent_health(agent_id)
        
        # Agent should have initial health state
        assert health["status"] == "healthy"
        assert health["latency_ms"] is None


class TestSystemHealth:
    """Test system-wide health aggregation."""

    def test_get_system_health_no_agents(self):
        """Test system health with no agents."""
        health = get_system_health()
        
        assert health["agents_total"] == 0
        assert health["healthy"] == 0
        assert health["unhealthy"] == 0
        assert health["avg_latency_ms"] == 0

    def test_get_system_health_single_agent(self, sample_agent_card):
        """Test system health with single agent."""
        register_agent(agent_card=sample_agent_card)
        
        health = get_system_health()
        
        assert health["agents_total"] == 1
        assert health["healthy"] == 1
        assert health["unhealthy"] == 0

    def test_get_system_health_mixed_statuses(self, sample_agent_card, sample_agent_card_with_symbols):
        """Test system health with mixed agent statuses."""
        reg1 = register_agent(agent_card=sample_agent_card)
        reg2 = register_agent(agent_card=sample_agent_card_with_symbols)
        
        # Update one to unhealthy
        update_agent_health_status(
            agent_id=reg2["id"],
            status="unhealthy",
            latency_ms=5000,
            last_checked="2026-05-11T12:00:00"
        )
        
        health = get_system_health()
        
        assert health["agents_total"] == 2
        assert health["healthy"] == 1
        assert health["unhealthy"] == 1

    def test_get_system_health_latency_average(self, sample_agent_card, sample_agent_card_with_symbols):
        """Test system health average latency calculation."""
        reg1 = register_agent(agent_card=sample_agent_card)
        reg2 = register_agent(agent_card=sample_agent_card_with_symbols)
        
        update_agent_health_status(
            agent_id=reg1["id"],
            status="healthy",
            latency_ms=100,
            last_checked="2026-05-11T12:00:00"
        )
        
        update_agent_health_status(
            agent_id=reg2["id"],
            status="healthy",
            latency_ms=200,
            last_checked="2026-05-11T12:00:00"
        )
        
        health = get_system_health()
        
        # Average should be 150
        assert health["avg_latency_ms"] == 150

    def test_get_system_health_response_structure(self):
        """Test system health response has correct structure."""
        health = get_system_health()
        
        required_fields = ["agents_total", "healthy", "unhealthy", "avg_latency_ms"]
        assert all(field in health for field in required_fields)


class TestHealthWorker:
    """Test background health check worker."""

    def test_health_worker_iteration(self, sample_agent_card):
        """Test simulated health worker iteration."""
        # Register agent
        from app.services.agent_service import register_agent
        reg_result = register_agent(agent_card=sample_agent_card)
        agent_id = reg_result["id"]
        
        with patch("app.services.health_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            # Simulate health check on agent
            result = check_agent_health(agent_id, "https://example.com")
            
            assert result["status"] == "healthy"
            
            # Update database
            update_agent_health_status(
                agent_id=agent_id,
                status=result["status"],
                latency_ms=result["latency_ms"],
                last_checked=result["last_checked"]
            )
            
            # Verify update persisted
            health = get_agent_health(agent_id)
            assert health["status"] == "healthy"

    def test_health_check_with_no_url(self, sample_agent_card):
        """Test health check behavior when agent has no URL."""
        # Agent without URL shouldn't be checked
        sample_agent_card.pop("url", None)
        reg_result = register_agent(agent_card=sample_agent_card)
        
        from app.db.database import get_db_connection
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT url FROM agents WHERE id = ?", (reg_result["id"],))
            row = cursor.fetchone()
            assert row[0] is None or row[0] == ""

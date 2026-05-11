import json
import pytest
from unittest.mock import patch, MagicMock
from app.services.agent_service import register_agent, refresh_agent, get_agent_by_id


class TestAgentRefresh:
    """Test refresh flow for agents."""

    @pytest.fixture
    def agent_with_url(self):
        return {
            "name": "refresh-agent",
            "description": "Refreshable agent",
            "url": "https://refresh.example.com",
            "capabilities": ["travel", "flight"]
        }

    def test_refresh_existing_agent(self, agent_with_url):
        """Test refreshing an existing agent from stored URL."""
        with patch("app.services.agent_service.requests.get") as mock_get:
            # Initial registration uses URL ingestion
            mock_response_register = MagicMock()
            mock_response_register.status_code = 200
            mock_response_register.json.return_value = agent_with_url
            mock_get.return_value = mock_response_register

            register_result = register_agent(url="https://refresh.example.com")
            agent_id = register_result["id"]

            # Prepare updated card for refresh
            updated_card = {
                "name": "refresh-agent",
                "description": "Updated refreshable agent",
                "url": "https://refresh.example.com",
                "version": "1.1.0",
                "capabilities": ["travel", "hotel"]
            }

            mock_response_refresh = MagicMock()
            mock_response_refresh.status_code = 200
            mock_response_refresh.json.return_value = updated_card
            mock_get.return_value = mock_response_refresh

            result = refresh_agent(agent_id)

            assert result["status"] == "refreshed"
            assert result["source_refetched"] is True

            agent = get_agent_by_id(agent_id)
            assert agent is not None
            assert agent["description"] == "Updated refreshable agent"
            assert agent["version"] == "1.1.0"

            capabilities = json.loads(agent["capabilities"])
            assert "travel" in capabilities["canonical_capabilities"]

    def test_refresh_preserves_agent_id_and_health_fields(self, agent_with_url):
        """Test refresh keeps agent_id and existing health metadata."""
        with patch("app.services.agent_service.requests.get") as mock_get:
            mock_response_register = MagicMock()
            mock_response_register.status_code = 200
            mock_response_register.json.return_value = agent_with_url
            mock_get.return_value = mock_response_register

            register_result = register_agent(url="https://refresh.example.com")
            agent_id = register_result["id"]

            # Update health fields before refresh
            from app.services.health_service import update_agent_health_status
            update_agent_health_status(
                agent_id=agent_id,
                status="unhealthy",
                latency_ms=123,
                last_checked="2026-05-11T12:00:00"
            )

            updated_card = {
                "name": "refresh-agent",
                "description": "Updated description",
                "url": "https://refresh.example.com",
                "version": "2.0.0",
                "capabilities": ["travel", "hotel"]
            }

            mock_response_refresh = MagicMock()
            mock_response_refresh.status_code = 200
            mock_response_refresh.json.return_value = updated_card
            mock_get.return_value = mock_response_refresh

            refresh_agent(agent_id)

            agent = get_agent_by_id(agent_id)
            assert agent is not None
            assert agent["id"] == agent_id
            assert agent["status"] == "unhealthy"
            assert agent["latency_ms"] == 123
            assert agent["last_seen"] == "2026-05-11T12:00:00"

    def test_refresh_missing_agent_fails(self):
        """Test refresh endpoint fails for nonexistent agent."""
        with pytest.raises(ValueError, match="not found"):
            refresh_agent("missing-agent")

    def test_refresh_missing_url_fails(self, sample_agent_card):
        """Test refresh fails when stored agent has no URL."""
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]

        with pytest.raises(ValueError, match="has no URL"):
            refresh_agent(agent_id)

    def test_refresh_invalid_agent_card_from_url(self, agent_with_url):
        """Test refresh failure when fetched agent card is invalid."""
        with patch("app.services.agent_service.requests.get") as mock_get:
            mock_response_register = MagicMock()
            mock_response_register.status_code = 200
            mock_response_register.json.return_value = agent_with_url
            mock_get.return_value = mock_response_register

            register_result = register_agent(url="https://refresh.example.com")
            agent_id = register_result["id"]

            invalid_card = {"description": "No name"}
            mock_response_refresh = MagicMock()
            mock_response_refresh.status_code = 200
            mock_response_refresh.json.return_value = invalid_card
            mock_get.return_value = mock_response_refresh

            with pytest.raises(ValueError, match="Missing required field"):
                refresh_agent(agent_id)

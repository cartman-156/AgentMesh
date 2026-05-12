import pytest
import json
from unittest.mock import patch, MagicMock
from app.services.agent_service import (
    register_agent,
    approve_agent,
    deregister_agent,
    get_agent_by_id,
    validate_agent_card,
    generate_agent_id
)


class TestAgentRegistration:
    """Test agent registration functionality."""

    def test_register_with_valid_agent_card(self, sample_agent_card):
        """Test registering an agent with valid JSON card."""
        result = register_agent(agent_card=sample_agent_card)
        
        assert result is not None
        assert "id" in result
        assert result["status"] == "registered"
        assert result["normalized"] is True
        
        # Verify agent was persisted
        agent = get_agent_by_id(result["id"])
        assert agent is not None
        assert agent["name"] == sample_agent_card["name"]

    def test_register_with_url(self, sample_agent_card):
        """Test registering an agent via URL ingestion."""
        with patch("app.services.agent_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = sample_agent_card
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            result = register_agent(url="https://example.com")
            
            assert result is not None
            assert result["status"] == "registered"
            assert result["normalized"] is True
            
            # Verify fetch was called
            mock_get.assert_called_once()
            assert "/.well-known/agent.json" in mock_get.call_args[0][0]

    def test_register_invalid_card_no_name(self):
        """Test that agent card without name is rejected."""
        invalid_card = {
            "description": "No name agent",
            "capabilities": []
        }
        
        with pytest.raises(ValueError, match="Missing required field"):
            register_agent(agent_card=invalid_card)

    def test_register_invalid_card_not_dict(self):
        """Test that non-dict agent card is rejected."""
        with pytest.raises(ValueError, match="must be a dictionary"):
            register_agent(agent_card="not a dict")

    def test_register_neither_card_nor_url(self):
        """Test that registering without card or URL fails."""
        with pytest.raises(ValueError, match="Either agent_card or url"):
            register_agent(agent_card=None, url=None)

    def test_register_both_card_and_url(self, sample_agent_card):
        """Test that providing both card and URL fails."""
        with pytest.raises(ValueError, match="Cannot provide both"):
            register_agent(agent_card=sample_agent_card, url="https://example.com")

    def test_register_url_invalid_json(self):
        """Test URL ingestion with invalid JSON response."""
        with patch("app.services.agent_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.json.side_effect = json.JSONDecodeError("Invalid", "", 0)
            mock_get.return_value = mock_response
            
            with pytest.raises(ValueError, match="Invalid JSON"):
                register_agent(url="https://example.com")

    def test_register_url_fetch_failure(self):
        """Test URL ingestion with network failure."""
        import requests
        with patch("app.services.agent_service.requests.get") as mock_get:
            mock_get.side_effect = requests.RequestException("Network error")
            
            with pytest.raises(ValueError, match="Failed to fetch"):
                register_agent(url="https://example.com")

    def test_agent_id_generated_from_name(self, sample_agent_card):
        """Test that agent ID is generated from name."""
        result = register_agent(agent_card=sample_agent_card)
        assert result["id"] == "test-weather-agent"

    def test_agent_id_deterministic(self, sample_agent_card):
        """Test that agent ID generation is deterministic."""
        id1 = generate_agent_id(sample_agent_card)
        id2 = generate_agent_id(sample_agent_card)
        assert id1 == id2

    def test_agent_id_from_hash_when_no_name(self):
        """Test that agent ID is hashed when name is missing."""
        card = {"description": "No name", "capabilities": []}
        agent_id = generate_agent_id(card)
        assert agent_id.startswith("agent-")
        assert len(agent_id) > 6

    def test_duplicate_registration_updates_existing(self, sample_agent_card):
        """Test that registering same agent twice updates it."""
        result1 = register_agent(agent_card=sample_agent_card)
        agent_id = result1["id"]
        
        # Modify and re-register
        sample_agent_card["description"] = "Updated description"
        result2 = register_agent(agent_card=sample_agent_card)
        
        assert result2["id"] == agent_id
        
        # Verify update
        agent = get_agent_by_id(agent_id)
        assert agent["description"] == "Updated description"

    def test_agent_stored_with_capabilities(self, sample_agent_card):
        """Test that agent is stored with normalized capabilities."""
        result = register_agent(agent_card=sample_agent_card)
        agent = get_agent_by_id(result["id"])
        
        capabilities = json.loads(agent["capabilities"])
        assert "raw_capabilities" in capabilities
        assert "normalized_capabilities" in capabilities
        assert "canonical_capabilities" in capabilities

    def test_agent_stored_with_raw_card(self, sample_agent_card):
        """Test that raw agent card is preserved."""
        result = register_agent(agent_card=sample_agent_card)
        agent = get_agent_by_id(result["id"])
        
        raw_card = json.loads(agent["raw_agent_card"])
        assert raw_card["name"] == sample_agent_card["name"]
        assert raw_card["description"] == sample_agent_card["description"]


class TestAgentValidation:
    """Test agent card validation."""

    def test_validate_valid_card(self, sample_agent_card):
        """Test validation of valid agent card."""
        assert validate_agent_card(sample_agent_card) is True

    def test_validate_missing_name(self):
        """Test validation rejects missing name."""
        card = {"description": "No name"}
        with pytest.raises(ValueError, match="Missing required field: name"):
            validate_agent_card(card)

    def test_validate_not_dict(self):
        """Test validation rejects non-dict."""
        with pytest.raises(ValueError, match="must be a dictionary"):
            validate_agent_card([])


class TestAgentRetrieval:
    """Test agent retrieval functionality."""

    def test_get_existing_agent(self, sample_agent_card):
        """Test retrieving an existing agent."""
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]
        
        agent = get_agent_by_id(agent_id)
        assert agent is not None
        assert agent["name"] == sample_agent_card["name"]

    def test_get_nonexistent_agent(self):
        """Test retrieving nonexistent agent returns None."""
        agent = get_agent_by_id("nonexistent")
        assert agent is None


class TestAgentApproval:
    """Test approval workflow for registered agents."""

    def test_approve_registered_agent(self, sample_agent_card):
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]

        approval = approve_agent(agent_id)

        assert approval["id"] == agent_id
        assert approval["status"] == "approved"

        # Verify approval state is persisted
        agent = get_agent_by_id(agent_id)
        assert agent is not None
        assert agent.get("approved", 0) == 1

    def test_approve_idempotent(self, sample_agent_card):
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]

        first = approve_agent(agent_id)
        second = approve_agent(agent_id)

        assert first == second
        assert second["status"] == "approved"

    def test_approve_nonexistent_agent_fails(self):
        with pytest.raises(ValueError, match="not found"):
            approve_agent("nonexistent")


class TestAgentDeregistration:
    """Test agent deregistration workflow."""

    def test_deregister_registered_agent(self, sample_agent_card):
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]

        dereg = deregister_agent(agent_id)

        assert dereg["id"] == agent_id
        assert dereg["status"] == "deregistered"

        agent = get_agent_by_id(agent_id)
        assert agent is not None
        assert agent.get("deregistered", 0) == 1

    def test_deregister_idempotent(self, sample_agent_card):
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]

        first = deregister_agent(agent_id)
        second = deregister_agent(agent_id)

        assert first == second
        assert second["status"] == "deregistered"

    def test_deregister_nonexistent_agent_fails(self):
        with pytest.raises(ValueError, match="not found"):
            deregister_agent("nonexistent")

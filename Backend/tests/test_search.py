import pytest
from app.services.agents_search_service import search_agents
from app.services.agent_service import register_agent


class TestAgentSearch:
    """Test agent search functionality."""

    @pytest.fixture
    def sample_agents(self, sample_agent_card, sample_agent_card_with_symbols):
        """Register sample agents for testing."""
        agent1 = register_agent(agent_card=sample_agent_card)
        agent2 = register_agent(agent_card=sample_agent_card_with_symbols)
        return agent1["id"], agent2["id"]

    def test_search_all_agents(self, sample_agents):
        """Test searching for all agents (no filters)."""
        result = search_agents()
        
        assert "query" in result
        assert "results" in result
        assert len(result["results"]) >= 2

    def test_search_by_agent_id_exact(self, sample_agents):
        """Test exact agent ID search."""
        agent_id, _ = sample_agents
        
        result = search_agents(agent_id=agent_id)
        
        assert len(result["results"]) == 1
        assert result["results"][0]["id"] == agent_id

    def test_search_by_agent_id_no_match(self):
        """Test agent ID search with no match."""
        result = search_agents(agent_id="nonexistent")
        
        assert len(result["results"]) == 0

    def test_search_by_name_partial(self, sample_agents):
        """Test partial name matching."""
        result = search_agents(name="weather", match="partial")
        
        assert len(result["results"]) >= 1
        assert any("weather" in a["name"].lower() for a in result["results"])

    def test_search_by_name_exact(self, sample_agents):
        """Test exact name matching."""
        agent_id, _ = sample_agents
        
        result = search_agents(name="test-weather-agent", match="exact")
        
        assert len(result["results"]) == 1
        assert result["results"][0]["id"] == agent_id

    def test_search_by_name_exact_no_match(self, sample_agents):
        """Test exact name search with no match."""
        result = search_agents(name="test-weather", match="exact")
        
        assert len(result["results"]) == 0

    def test_search_by_capability_canonical(self, sample_agents):
        """Test search by canonical capability."""
        result = search_agents(capability="weather")
        
        assert len(result["results"]) >= 1
        # First agent should match
        assert result["results"][0]["name"] == "test-weather-agent"

    def test_search_by_capability_unknown(self, sample_agents):
        """Test search for unclassified capabilities."""
        result = search_agents(capability="unclassified")
        
        # Both agents have unknown capabilities
        assert len(result["results"]) >= 2

    def test_search_by_capability_partial(self, sample_agents):
        """Test partial capability matching."""
        result = search_agents(capability="finance", match="partial")
        
        assert len(result["results"]) >= 1

    def test_search_by_capability_exact(self, sample_agents):
        """Test exact capability matching."""
        result = search_agents(capability="weather", match="exact")
        
        assert len(result["results"]) >= 1

    def test_search_multiple_filters_and_semantics(self, sample_agents):
        """Test AND semantics with multiple filters."""
        agent_id, _ = sample_agents
        
        # Search with multiple filters
        result = search_agents(
            agent_id=agent_id,
            capability="weather"
        )
        
        # Should match both filters (agent_id AND capability)
        assert len(result["results"]) == 1
        assert result["results"][0]["id"] == agent_id

    def test_search_filters_dont_match_and_semantics(self, sample_agents):
        """Test AND semantics when filters conflict."""
        agent_id, _ = sample_agents
        
        # First agent has weather but not finance
        result = search_agents(
            agent_id=agent_id,
            capability="finance"
        )
        
        # Should return empty (agent doesn't have finance capability)
        assert len(result["results"]) == 0

    def test_search_returns_query_info(self, sample_agents):
        """Test that search response includes query info."""
        result = search_agents(
            agent_id="test",
            name="weather",
            capability="weather",
            match="exact"
        )
        
        assert "query" in result
        query = result["query"]
        assert query["agent_id"] == "test"
        assert query["name"] == "weather"
        assert query["capability"] == "weather"
        assert query["match"] == "exact"

    def test_search_default_match_is_partial(self, sample_agents):
        """Test that default match mode is partial."""
        result = search_agents(name="weather")
        
        assert result["query"]["match"] == "partial"

    def test_search_case_insensitive_name(self, sample_agents):
        """Test that name search is case-insensitive."""
        result1 = search_agents(name="WEATHER", match="partial")
        result2 = search_agents(name="weather", match="partial")
        
        assert len(result1["results"]) == len(result2["results"])

    def test_search_empty_result_valid_structure(self):
        """Test that empty search results have valid structure."""
        result = search_agents(agent_id="nonexistent")
        
        assert "query" in result
        assert "results" in result
        assert isinstance(result["results"], list)
        assert len(result["results"]) == 0


class TestSearchIntegration:
    """Integration tests for search with other components."""

    def test_search_finds_registered_agent(self, sample_agent_card):
        """Test that search finds newly registered agents."""
        register_agent(agent_card=sample_agent_card)
        
        result = search_agents(name="test-weather-agent", match="exact")
        
        assert len(result["results"]) == 1

    def test_search_finds_by_normalized_capability(self, sample_agent_card_with_symbols):
        """Test that search finds agents with normalized capabilities."""
        register_agent(agent_card=sample_agent_card_with_symbols)
        
        # Search by canonical category
        result = search_agents(capability="finance")
        
        assert len(result["results"]) >= 1

import pytest
from app.services.agents_search_service import search_agents
from app.services.agent_service import register_agent, approve_agent, deregister_agent


class TestAgentSearch:
    """Test agent search functionality."""

    @pytest.fixture
    def sample_agents(self, sample_agent_card, sample_agent_card_with_symbols):
        """Register and approve sample agents for testing."""
        agent1 = register_agent(agent_card=sample_agent_card)
        approve_agent(agent1["id"])

        agent2 = register_agent(agent_card=sample_agent_card_with_symbols)
        approve_agent(agent2["id"])

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

    def test_search_by_description_partial(self, sample_agents):
        """Test searching by description."""
        result = search_agents(description="weather forecast")
        
        assert len(result["results"]) >= 1
        assert any("weather" in a["description"].lower() for a in result["results"])

    def test_search_by_skills_partial(self, sample_agents):
        """Test searching by skills."""
        # The sample_agent_card has skills: ["forecasting", "alerts"]
        result = search_agents(skills="forecast")
        
        assert len(result["results"]) >= 1
        # Skill match logic checks the skills array in json_data

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
            description="desc",
            skills="skill",
            only_approved=True,
            match="exact"
        )
        
        assert "query" in result
        query = result["query"]
        assert query["agent_id"] == "test"
        assert query["name"] == "weather"
        assert query["capability"] == "weather"
        assert query["description"] == "desc"
        assert query["skills"] == "skill"
        assert query["only_approved"] is True
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

    def test_search_finds_approved_agent(self, sample_agent_card):
        """Test that search finds approved agents."""
        result = register_agent(agent_card=sample_agent_card)
        approve_agent(result["id"])
        
        result = search_agents(name="test-weather-agent", match="exact")
        
        assert len(result["results"]) == 1

    def test_search_includes_deregistered_agent(self, sample_agent_card):
        """Deregistered agents should still appear in search results."""
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]
        approve_agent(agent_id)
        deregister_agent(agent_id)

        result = search_agents(name="test-weather-agent", match="exact")
        assert len(result["results"]) == 1
        assert result["results"][0]["status"] == "deregistered"
        assert result["results"][0]["deregistered"] == 1

    def test_search_finds_by_normalized_capability(self, sample_agent_card_with_symbols):
        """Test that search finds agents with normalized capabilities."""
        result = register_agent(agent_card=sample_agent_card_with_symbols)
        approve_agent(result["id"])
        
        # Search by canonical category
        result = search_agents(capability="finance")
        
        assert len(result["results"]) >= 1

    def test_search_includes_unapproved_agents(self, sample_agent_card):
        """Unapproved agents should still appear in search results."""
        register_agent(agent_card=sample_agent_card)
        result = search_agents(name="test-weather-agent", match="exact")
        assert len(result["results"]) == 1
        assert result["results"][0]["approved"] == 0

    def test_search_excludes_rejected_agents(self, sample_agent_card):
        """Rejected agents should not remain discoverable."""
        result = register_agent(agent_card=sample_agent_card)
        agent_id = result["id"]
        approve_agent(agent_id)
        approve_agent(agent_id, action="reject")

        result = search_agents(name="test-weather-agent", match="exact")
        assert len(result["results"]) == 0

    def test_search_only_approved_filter(self, sample_agent_card):
        """Test that only_approved filter strictly restricts results."""
        # 1. Register but don't approve
        register_agent(agent_card=sample_agent_card)
        
        # 2. Search without filter - should find it
        res_all = search_agents(name="test-weather-agent")
        assert len(res_all["results"]) == 1
        
        # 3. Search with only_approved=True - should NOT find it
        res_approved = search_agents(name="test-weather-agent", only_approved=True)
        assert len(res_approved["results"]) == 0
        
        # 4. Approve and search again - should find it
        approve_agent("test-weather-agent")
        res_after = search_agents(name="test-weather-agent", only_approved=True)
        assert len(res_after["results"]) == 1

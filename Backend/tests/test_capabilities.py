import pytest
from app.core.capability_normalization import normalize_capabilities
from app.core.capabilities_map import get_canonical


class TestCapabilityNormalization:
    """Test capability normalization pipeline."""

    def test_lowercase_normalization(self):
        """Test that capabilities are lowercased."""
        result = normalize_capabilities(["WEATHER"])
        assert "weather" in result["normalized_capabilities"]

    def test_trim_spaces(self):
        """Test that leading/trailing spaces are trimmed."""
        result = normalize_capabilities(["  weather  "])
        assert "weather" in result["normalized_capabilities"]

    def test_replace_underscores(self):
        """Test that underscores are replaced with spaces."""
        result = normalize_capabilities(["stock_market"])
        assert "stock market" in result["normalized_capabilities"]

    def test_replace_hyphens(self):
        """Test that hyphens are replaced with spaces."""
        result = normalize_capabilities(["machine-learning"])
        assert "machine learning" in result["normalized_capabilities"]

    def test_deduplication(self):
        """Test that duplicate capabilities are deduplicated."""
        result = normalize_capabilities(["weather", "WEATHER", "Weather"])
        
        # After normalization, all should be lowercase "weather"
        normalized_count = result["normalized_capabilities"].count("weather")
        assert normalized_count == 1

    def test_canonical_mapping(self):
        """Test canonical capability mapping."""
        result = normalize_capabilities(["weather", "climate", "meteorology"])
        
        # All should map to "weather" canonical
        assert "weather" in result["canonical_capabilities"]
        assert result["canonical_capabilities"].count("weather") == 1

    def test_unknown_capability_unclassified(self):
        """Test that unknown capabilities map to unclassified."""
        result = normalize_capabilities(["xyz-unknown-service"])
        
        assert "unclassified" in result["canonical_capabilities"]

    def test_multiple_normalization_steps(self):
        """Test full pipeline: lowercase, trim, replace, dedupe, map."""
        raw = ["  Stock_Market  ", "STOCK-MARKET", "stock market"]
        result = normalize_capabilities(raw)
        
        # Should have 1 normalized (after dedup) and 1 canonical (finance)
        assert len(result["normalized_capabilities"]) == 1
        assert "stock market" in result["normalized_capabilities"]
        assert "finance" in result["canonical_capabilities"]

    def test_mixed_known_unknown(self):
        """Test normalization with mix of known and unknown capabilities."""
        result = normalize_capabilities(["weather", "unknown-xyz", "finance"])
        
        assert "weather" in result["canonical_capabilities"]
        assert "finance" in result["canonical_capabilities"]
        assert "unclassified" in result["canonical_capabilities"]

    def test_empty_list(self):
        """Test normalization of empty capabilities list."""
        result = normalize_capabilities([])
        
        assert result["raw_capabilities"] == []
        assert result["normalized_capabilities"] == []
        assert result["canonical_capabilities"] == []

    def test_non_string_values_ignored(self):
        """Test that non-string values are ignored."""
        result = normalize_capabilities(["weather", 123, None, ["list"], {"dict": "value"}])
        
        # Only "weather" should be processed
        assert "weather" in result["normalized_capabilities"]
        assert len(result["normalized_capabilities"]) == 1

    def test_preserves_raw_capabilities(self):
        """Test that raw capabilities are preserved exactly."""
        raw = ["WEATHER", "Stock-Market"]
        result = normalize_capabilities(raw)
        
        assert result["raw_capabilities"] == raw


class TestCanonicalMapping:
    """Test canonical capability mapping."""

    def test_get_canonical_weather(self):
        """Test weather capability mapping."""
        assert get_canonical("weather") == "weather"

    def test_get_canonical_finance(self):
        """Test finance capability mapping."""
        assert get_canonical("stock") == "finance"
        assert get_canonical("market") == "finance"
        assert get_canonical("trading") == "finance"

    def test_get_canonical_travel(self):
        """Test travel capability mapping."""
        assert get_canonical("flight") == "travel"
        assert get_canonical("hotel") == "travel"

    def test_get_canonical_ai_ml(self):
        """Test AI/ML capability mapping."""
        assert get_canonical("machine learning") == "ai ml"
        assert get_canonical("llm") == "ai ml"

    def test_get_canonical_unknown(self):
        """Test unmapped capability returns unclassified."""
        assert get_canonical("xyz-unknown") == "unclassified"

    def test_get_canonical_case_insensitive(self):
        """Test that mapping is case-insensitive (input should be lowercase)."""
        # Normalization lowercases before mapping
        assert get_canonical("weather") == get_canonical("Weather")


class TestCapabilityIntegration:
    """Integration tests for capability processing."""

    def test_full_registration_flow_with_capabilities(self):
        """Test capabilities are correctly processed during registration."""
        from app.services.agent_service import register_agent
        import json
        
        agent_card = {
            "name": "test-agent",
            "capabilities": ["STOCK-Market", "crypto_currency", "unknown-xyz"]
        }
        
        result = register_agent(agent_card=agent_card)
        
        # Retrieve and check capabilities
        from app.services.agent_service import get_agent_by_id
        agent = get_agent_by_id(result["id"])
        
        caps = json.loads(agent["capabilities"])
        
        # Check raw
        assert len(caps["raw_capabilities"]) == 3
        
        # Check normalized (should be lowercase and spaces)
        assert "stock market" in caps["normalized_capabilities"]
        assert "crypto currency" in caps["normalized_capabilities"]
        
        # Check canonical
        assert "finance" in caps["canonical_capabilities"]
        assert "unclassified" in caps["canonical_capabilities"]

    def test_search_by_canonical_capability(self):
        """Test searching by canonical capability after registration."""
        from app.services.agent_service import register_agent
        from app.services.agents_search_service import search_agents
        
        agent_card = {
            "name": "weather-agent",
            "capabilities": ["temperature", "precipitation"]
        }
        
        register_agent(agent_card=agent_card)
        
        # Search by canonical weather capability
        result = search_agents(capability="weather")
        
        assert len(result["results"]) > 0
        assert any(a["name"] == "weather-agent" for a in result["results"])

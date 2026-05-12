import pytest
import tempfile
import sqlite3
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure the Backend package root is on the import path for tests
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Configure test database
@pytest.fixture(scope="session")
def test_db():
    """Create a temporary test database."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test.db")
        
        # Patch the database path
        with patch("app.db.database.DB_PATH", db_path):
            # Initialize test database
            from app.db.database import init_db
            init_db()
            
            yield db_path


@pytest.fixture(autouse=True)
def reset_db(test_db):
    """Reset database before each test."""
    # Clear agents table
    conn = sqlite3.connect(test_db)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM agents")
    conn.commit()
    conn.close()
    
    yield


@pytest.fixture
def sample_agent_card():
    """Sample valid agent card."""
    return {
        "name": "test-weather-agent",
        "description": "A test weather agent",
        "version": "1.0.0",
        "url": "https://weather.example.com",
        "capabilities": ["weather", "forecast"]
    }


@pytest.fixture
def sample_agent_card_with_symbols():
    """Sample agent card with special characters in capabilities."""
    return {
        "name": "test-finance-agent",
        "description": "A test finance agent",
        "version": "1.0.0",
        "capabilities": ["stock", "crypto_currency", "financial"]
    }


@pytest.fixture
def sample_agent_card_unknown_cap():
    """Sample agent card with unknown capabilities."""
    return {
        "name": "test-unknown-agent",
        "description": "Test unknown capabilities",
        "capabilities": ["xyz-123", "unknown-service"]
    }

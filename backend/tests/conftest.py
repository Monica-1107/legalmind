import pytest
from app import app as flask_app
import os
from pymongo import MongoClient
from unittest.mock import MagicMock

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create the app with common test config
    flask_app.config.update({
        'TESTING': True,
        'UPLOAD_FOLDER': os.path.join(os.path.dirname(__file__), 'test_files'),
        'MONGO_URI': 'mongodb://localhost:27017/legal_mind_test'
    })
    
    yield flask_app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's CLI commands."""
    return app.test_cli_runner()

@pytest.fixture
def sample_pdf():
    """Get the path to the sample PDF file."""
    return os.path.join(os.path.dirname(__file__), 'test_files', 'Appeal No.pdf')

@pytest.fixture
def sample_docx():
    """Get the path to the sample DOCX file."""
    return os.path.join(os.path.dirname(__file__), 'test_files', 'Appeal No.docx')

@pytest.fixture
def mock_mongo_client():
    """Create a mock MongoDB client for testing."""
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_client.__getitem__.return_value = mock_db
    return mock_client

@pytest.fixture
def test_db(mock_mongo_client):
    """Create a test database using mock client."""
    db = mock_mongo_client['legal_mind_test']
    return db 
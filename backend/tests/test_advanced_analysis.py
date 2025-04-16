import pytest
import os
from unittest.mock import patch, MagicMock
from services.advanced_analysis_service import AdvancedAnalysisService
from config import Config

# Define test files directory
TEST_FILES_DIR = os.path.join(os.path.dirname(__file__), 'test_files')

# Mock responses
MOCK_API_RESPONSE = {
    'choices': [{
        'message': {
            'content': 'This is a mock response from the API. It contains legal analysis of the document.'
        }
    }]
}

@pytest.fixture
def mock_openrouter_response():
    """Mock the OpenRouter API response"""
    with patch('requests.post') as mock_post:
        mock_post.return_value.json.return_value = MOCK_API_RESPONSE
        yield mock_post

@pytest.fixture
def advanced_analysis_service():
    return AdvancedAnalysisService()

@pytest.fixture
def sample_pdf_path():
    # Use any existing PDF file from test_files directory
    pdf_files = [f for f in os.listdir(TEST_FILES_DIR) if f.endswith('.pdf')]
    if not pdf_files:
        raise ValueError("No PDF files found in test_files directory")
    return os.path.join(TEST_FILES_DIR, pdf_files[0])

@pytest.fixture
def sample_docx_path():
    # Use any existing DOCX file from test_files directory
    docx_files = [f for f in os.listdir(TEST_FILES_DIR) if f.endswith('.docx')]
    if not docx_files:
        raise ValueError("No DOCX files found in test_files directory")
    return os.path.join(TEST_FILES_DIR, docx_files[0])

def test_process_document_pdf(advanced_analysis_service, sample_pdf_path):
    """Test processing a PDF document."""
    result = advanced_analysis_service.process_document(sample_pdf_path, "test_doc_1")
    
    assert result['document_id'] == "test_doc_1"
    assert result['num_chunks'] > 0
    assert isinstance(result['entities'], dict)
    assert "test_doc_1" in advanced_analysis_service.document_cache

def test_process_document_docx(advanced_analysis_service, sample_docx_path):
    """Test processing a DOCX document."""
    result = advanced_analysis_service.process_document(sample_docx_path, "test_doc_2")
    
    assert result['document_id'] == "test_doc_2"
    assert result['num_chunks'] > 0
    assert isinstance(result['entities'], dict)
    assert "test_doc_2" in advanced_analysis_service.document_cache

def test_process_document_invalid_format(advanced_analysis_service):
    """Test processing a document with invalid format."""
    with pytest.raises(ValueError, match="Unsupported file format"):
        advanced_analysis_service.process_document("test.txt", "test_doc_3")

def test_analyze_query(advanced_analysis_service, sample_pdf_path, mock_openrouter_response):
    """Test analyzing a query against a processed document."""
    # First process the document
    doc_id = "test_doc_4"
    advanced_analysis_service.process_document(sample_pdf_path, doc_id)
    
    # Test with a relevant query
    result = advanced_analysis_service.analyze_query(
        "What are the main arguments in this appeal?",
        doc_id,
        query_type="standard_analysis"
    )
    
    assert result['is_relevant'] is True
    assert 'response' in result
    assert 'relevant_chunks' in result
    assert isinstance(result['entities'], dict)
    
    # Test with an obviously irrelevant query
    result = advanced_analysis_service.analyze_query(
        "What is the recipe for chocolate chip cookies? How many eggs do I need?",
        doc_id,
        query_type="standard_analysis"
    )
    
    assert result['is_relevant'] is False
    assert 'message' in result

def test_analyze_query_nonexistent_document(advanced_analysis_service):
    """Test analyzing a query against a nonexistent document."""
    with pytest.raises(ValueError, match="Document .* not found"):
        advanced_analysis_service.analyze_query(
            "Test query",
            "nonexistent_doc",
            query_type="standard_analysis"
        )

def test_get_document_summary(advanced_analysis_service, sample_pdf_path, mock_openrouter_response):
    """Test getting a document summary."""
    # First process the document
    doc_id = "test_doc_5"
    advanced_analysis_service.process_document(sample_pdf_path, doc_id)
    
    # Test with different layers
    for layer in [1, 2, 3]:
        result = advanced_analysis_service.get_document_summary(doc_id, layer=layer)
        
        assert 'summary' in result
        assert isinstance(result['entities'], dict)
        assert isinstance(result['summary'], str)
        assert len(result['summary']) > 0

def test_analyze_hypothetical_scenario(advanced_analysis_service, sample_pdf_path, mock_openrouter_response):
    """Test analyzing a hypothetical scenario."""
    # First process the document
    doc_id = "test_doc_6"
    advanced_analysis_service.process_document(sample_pdf_path, doc_id)
    
    # Test with a modification request
    result = advanced_analysis_service.analyze_hypothetical_scenario(
        doc_id,
        "How would the outcome change if the appellant had filed the appeal one month later?"
    )
    
    assert 'analysis' in result
    assert isinstance(result['entities'], dict)
    assert isinstance(result['analysis'], str)
    assert len(result['analysis']) > 0

def test_clear_document_cache(advanced_analysis_service, sample_pdf_path):
    """Test clearing the document cache."""
    # Process multiple documents
    doc_ids = ["test_doc_7", "test_doc_8"]
    for doc_id in doc_ids:
        advanced_analysis_service.process_document(sample_pdf_path, doc_id)
    
    # Test clearing specific document
    advanced_analysis_service.clear_document_cache(doc_ids[0])
    assert doc_ids[0] not in advanced_analysis_service.document_cache
    assert doc_ids[1] in advanced_analysis_service.document_cache
    
    # Test clearing all documents
    advanced_analysis_service.clear_document_cache()
    assert len(advanced_analysis_service.document_cache) == 0 
import pytest
from services.document_service import process_document
from services.analysis_service import analyze_document
from services.chat_service import generate_chat_response
from database import insert_document, insert_chat_message

def test_process_document_pdf(sample_pdf,test_db):
    """Test document processing for PDF files."""
    result = process_document(sample_pdf, 'test.pdf')
    assert isinstance(result, dict)
    assert 'content' in result
    assert 'metadata' in result
    assert result['metadata']['file_type'] == 'pdf'
    
    # Test database integration
    doc_id = insert_document({
        "filename": "test.pdf",
        "file_path": sample_pdf,
        "content": result['content'],
        "metadata": result['metadata']
    })
    assert doc_id is not None

def test_process_document_docx(sample_docx, test_db):
    """Test document processing for DOCX files."""
    result = process_document(sample_docx, 'test.docx')
    assert isinstance(result, dict)
    assert 'content' in result
    assert 'metadata' in result
    assert result['metadata']['file_type'] == 'docx'
    
    # Test database integration
    doc_id = insert_document({
        "filename": "test.docx",
        "file_path": sample_docx,
        "content": result['content'],
        "metadata": result['metadata']
    })
    assert doc_id is not None

def test_analyze_document_standard(sample_pdf, test_db):
    """Test document analysis in standard mode."""
    doc_info = process_document(sample_pdf, 'test.pdf')
    result = analyze_document(
        sample_pdf,
        doc_info['content'],
        analysis_mode='standard',
        analysis_level=1
    )
    assert isinstance(result, dict)
    assert 'summary' in result
    assert 'key_points' in result
    
    # Test database integration
    doc_id = insert_document({
        "filename": "test.pdf",
        "file_path": sample_pdf,
        "content": doc_info['content'],
        "analysis_results": result
    })
    assert doc_id is not None

def test_analyze_document_hypothetical(sample_pdf, test_db):
    """Test document analysis with hypothetical scenario."""
    doc_info = process_document(sample_pdf, 'test.pdf')
    result = analyze_document(
        sample_pdf,
        doc_info['content'],
        analysis_mode='hypothetical',
        analysis_level=2,
        hypothetical_scenario={'scenario': 'test'}
    )
    assert isinstance(result, dict)
    assert 'scenario_analysis' in result
    
    # Test database integration
    doc_id = insert_document({
        "filename": "test.pdf",
        "file_path": sample_pdf,
        "content": doc_info['content'],
        "analysis_results": result
    })
    assert doc_id is not None

def test_generate_chat_response(test_db):
    """Test chat response generation."""
    message = "What is this document about?"
    chat_history = []
    response = generate_chat_response(message, chat_history)
    assert isinstance(response, dict)
    assert len(response) > 0
    
    # Test database integration
    message_id = insert_chat_message({
        "user_message": message,
        "ai_response": response
    })
    assert message_id is not None

def test_generate_chat_response_with_context(sample_pdf, test_db):
    """Test chat response generation with document context."""
    doc_info = process_document(sample_pdf, 'test.pdf')
    message = "What is this document about?"
    chat_history = []
    response = generate_chat_response(
        message,
        chat_history,
        document_content=doc_info['content']
    )
    assert isinstance(response, dict)
    assert len(response) > 0
    
    # Test database integration
    doc_id = insert_document({
        "filename": "test.pdf",
        "file_path": sample_pdf,
        "content": doc_info['content']
    })
    
    message_id = insert_chat_message({
        "document_id": doc_id,
        "user_message": message,
        "ai_response": response
    })
    assert message_id is not None 
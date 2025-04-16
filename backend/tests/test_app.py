import pytest
import json
import os
from datetime import datetime
from unittest.mock import patch, MagicMock
from bson import ObjectId

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'timestamp' in data

def test_upload_file_no_file(client):
    """Test file upload endpoint with no file."""
    response = client.post('/api/upload')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'No file part'

def test_upload_file_empty_filename(client):
    """Test file upload endpoint with empty filename."""
    response = client.post('/api/upload', data={'file': (None, '')})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'No selected file'

@patch('app.get_db')
def test_upload_file_success(mock_get_db, client, sample_pdf, test_db):
    """Test successful file upload."""
    # Create a mock ObjectId
    mock_id = ObjectId()
    
    # Set up the mock database
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_insert_result = MagicMock()
    mock_insert_result.inserted_id = mock_id
    
    mock_collection.insert_one.return_value = mock_insert_result
    mock_db.documents = mock_collection
    mock_get_db.return_value = mock_db
    
    with open(sample_pdf, 'rb') as f:
        response = client.post(
            '/api/upload',
            data={'file': (f, 'Appeal No.pdf')},
            content_type='multipart/form-data'
        )
    
    # Verify response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'document_id' in data
    assert data['filename'] == 'Appeal_No.pdf'  # secure_filename replaces space with underscore
    assert 'upload_date' in data
    
    # Verify database interaction
    mock_collection.insert_one.assert_called_once()
    call_args = mock_collection.insert_one.call_args[0][0]
    assert call_args['filename'] == 'Appeal_No.pdf'
    assert call_args['file_type'] == 'pdf'
    assert 'content' in call_args
    assert 'metadata' in call_args
    assert 'created_at' in call_args

@patch('app.get_db')
def test_get_documents(mock_get_db, client, test_db):
    """Test getting all documents."""
    mock_get_db.return_value = test_db
    test_db.documents.find.return_value = [{
        "_id": "test_id",
        "filename": "Appeal No.pdf",
        "file_path": "/path/to/Appeal No.pdf",
        "file_type": 'pdf',
        "content": "Test content",
        "created_at": datetime.now()
    }]
    
    response = client.get('/api/documents')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'documents' in data
    assert isinstance(data['documents'], list)
    assert len(data['documents']) >= 1
    #assert data['documents'][0]['filename'] == 'Appeal No.pdf'

@patch('app.get_db')
def test_get_document_not_found(mock_get_db, client, test_db):
    """Test getting a non-existent document."""
    mock_get_db.return_value = test_db
    test_db.documents.find_one.return_value = None
    
    response = client.get('/api/documents/nonexistent_id')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Document not found'

@patch('app.get_db')
def test_analyze_document_not_found(mock_get_db, client, test_db):
    """Test analyzing a non-existent document."""
    mock_get_db.return_value = test_db
    test_db.documents.find_one.return_value = None
    
    response = client.post('/api/documents/nonexistent_id/analyze')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Document not found'

def test_chat_no_message(client):
    """Test chat endpoint with no message."""
    response = client.post('/api/chat', json={})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'No message provided'

@patch('app.get_db')
def test_chat_with_document_not_found(mock_get_db, client, test_db):
    """Test chat endpoint with non-existent document."""
    mock_get_db.return_value = test_db
    test_db.documents.find_one.return_value = None
    
    response = client.post('/api/chat', json={
        'message': 'Hello',
        'document_id': 'nonexistent_id'
    })
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Document not found'

# Knowledge Graph Tests
def test_create_document_graph(client, sample_pdf, sample_docx):
    """Test creating a knowledge graph from documents."""
    # Upload documents first
    with open(sample_pdf, 'rb') as f:
        response = client.post('/api/upload', data={'file': (f, 'Appeal No.pdf')})
    assert response.status_code == 201
    doc1_id = response.json['document_id']
    
    with open(sample_docx, 'rb') as f:
        response = client.post('/api/upload', data={'file': (f, 'Appeal No.docx')})
    assert response.status_code == 201
    doc2_id = response.json['document_id']
    
    # Create graph
    response = client.post('/api/documents/graph', json={
        'document_ids': [doc1_id, doc2_id],
        'graph_name': 'test_document_graph'
    })
    
    # Check response
    assert response.status_code == 201
    assert 'id' in response.json
    assert 'name' in response.json
    assert response.json['name'] == 'test_document_graph'
    assert 'file_path' in response.json
    assert 'visualization_path' in response.json
    assert 'node_count' in response.json
    assert 'edge_count' in response.json

def test_create_document_graph_invalid_doc_id(client):
    """Test creating a knowledge graph with invalid document IDs."""
    response = client.post('/api/documents/graph', json={
        'document_ids': ['invalid_id'],
        'graph_name': 'test_graph'
    })
    
    assert response.status_code == 404
    assert 'error' in response.json

def test_create_chat_graph(client, sample_pdf):
    """Test creating a knowledge graph from chat history."""
    # Upload a document first
    with open(sample_pdf, 'rb') as f:
        response = client.post('/api/upload', data={'file': (f, 'Appeal No.pdf')})
    assert response.status_code == 201
    doc_id = response.json['document_id']
    
    # Create a chat session and save messages to database
    chat_history = [
        {'user_message': 'Tell me about this document', 'ai_response': 'This is a test document.'},
        {'user_message': 'What are the key points?', 'ai_response': 'The key points are...'}
    ]
    
    # Save chat messages to database
    for message in chat_history:
        response = client.post('/api/chat', json={
            'message': message['user_message'],
            'document_id': doc_id,
            'session_id': 'test_session'
        })
        assert response.status_code == 200
    
    # Create graph
    response = client.post('/api/chat/graph', json={
        'chat_session_id': 'test_session',
        'document_ids': [doc_id],
        'graph_name': 'test_chat_graph'
    })
    
    assert response.status_code == 201
    assert 'id' in response.json
    assert 'name' in response.json
    assert response.json['name'] == 'test_chat_graph'
    assert 'file_path' in response.json
    assert 'visualization_path' in response.json
    assert 'node_count' in response.json
    assert 'edge_count' in response.json

def test_get_graph(client, sample_pdf):
    """Test retrieving a knowledge graph by ID."""
    # Upload a document
    with open(sample_pdf, 'rb') as f:
        response = client.post('/api/upload', data={'file': (f, 'Appeal No.pdf')})
    assert response.status_code == 201
    doc_id = response.json['document_id']
    
    # Create a graph
    response = client.post('/api/documents/graph', json={
        'document_ids': [doc_id],
        'graph_name': 'test_get_graph'
    })
    assert response.status_code == 201
    graph_id = response.json['id']
    
    # Get the graph
    response = client.get(f'/api/graphs/{graph_id}')
    assert response.status_code == 200
    assert response.json['id'] == graph_id
    assert response.json['name'] == 'test_get_graph'
    assert 'document_ids' in response.json
    assert 'nodes' in response.json
    assert 'edges' in response.json

def test_get_nonexistent_graph(client):
    """Test retrieving a nonexistent graph."""
    response = client.get('/api/graphs/nonexistent_id')
    assert response.status_code == 404
    assert 'error' in response.json

def test_get_graph_visualization(client, sample_pdf):
    """Test retrieving a graph visualization."""
    # Upload a document
    with open(sample_pdf, 'rb') as f:
        response = client.post('/api/upload', data={'file': (f, 'Appeal No.pdf')})
    assert response.status_code == 201
    doc_id = response.json['document_id']
    
    # Create a graph
    response = client.post('/api/documents/graph', json={
        'document_ids': [doc_id],
        'graph_name': 'test_visualization_graph'
    })
    assert response.status_code == 201
    graph_id = response.json['id']
    
    # Get the visualization
    response = client.get(f'/api/graphs/{graph_id}/visualization')
    assert response.status_code == 200
    assert response.content_type == 'image/png'

def test_get_nonexistent_graph_visualization(client):
    """Test retrieving a nonexistent graph visualization."""
    response = client.get('/api/graphs/nonexistent_id/visualization')
    assert response.status_code == 404
    assert 'error' in response.json 
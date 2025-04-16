import pytest
import os
import json
import networkx as nx
from unittest.mock import patch, MagicMock
from services.knowledge_graph_service import KnowledgeGraphService

@pytest.fixture
def knowledge_graph_service():
    """Create a knowledge graph service for testing."""
    with patch('services.knowledge_graph_service.Config') as mock_config:
        mock_config.UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'test_files')
        service = KnowledgeGraphService()
        # Create test directory
        os.makedirs(service.graph_dir, exist_ok=True)
        yield service
        # Clean up after tests
        for file in os.listdir(service.graph_dir):
            os.remove(os.path.join(service.graph_dir, file))
        os.rmdir(service.graph_dir)

@pytest.fixture
def sample_documents():
    """Create sample documents for testing using actual test files."""
    test_files_dir = os.path.join(os.path.dirname(__file__), 'test_files')
    pdf_file = os.path.join(test_files_dir, 'Appeal No.pdf')
    docx_file = os.path.join(test_files_dir, 'Appeal No.docx')
    
    return [
        {
            "_id": "doc1",
            "filename": "Appeal No.pdf",
            "file_path": pdf_file,
            "content": "This is a test document about John Smith and Jane Doe. They are involved in a legal case.",
            "metadata": {"file_type": "pdf"}
        },
        {
            "_id": "doc2",
            "filename": "Appeal No.docx",
            "file_path": docx_file,
            "content": "Another document mentioning John Smith and the legal proceedings.",
            "metadata": {"file_type": "docx"}
        }
    ]

@pytest.fixture
def sample_chat_history():
    """Create sample chat history for testing."""
    return [
        {
            "user_message": "Tell me about John Smith",
            "ai_response": "John Smith is mentioned in the document as being involved in a legal case."
        },
        {
            "user_message": "What about Jane Doe?",
            "ai_response": "Jane Doe is also mentioned in the document as being involved in the same legal case."
        }
    ]

def test_generate_document_graph(knowledge_graph_service, sample_documents):
    """Test generating a knowledge graph from documents."""
    # Generate graph
    graph_info = knowledge_graph_service.generate_document_graph(sample_documents, "test_document_graph")
    
    # Check graph info
    assert graph_info["name"] == "test_document_graph"
    assert "id" in graph_info
    assert "file_path" in graph_info
    assert "visualization_path" in graph_info
    assert graph_info["node_count"] > 0
    assert graph_info["edge_count"] >= 0
    
    # Check that files were created
    assert os.path.exists(graph_info["file_path"])
    assert os.path.exists(graph_info["visualization_path"])
    
    # Check JSON file content
    with open(graph_info["file_path"], 'r') as f:
        graph_data = json.load(f)
    
    assert graph_data["name"] == "test_document_graph"
    assert graph_data["id"] == graph_info["id"]
    assert "document_ids" in graph_data
    assert "doc1" in graph_data["document_ids"]
    assert "doc2" in graph_data["document_ids"]
    assert "nodes" in graph_data
    assert "edges" in graph_data
    
    # Check that entities were extracted
    entity_labels = [node["label"] for node in graph_data["nodes"] if node["type"] == "entity"]
    assert "John" in entity_labels
    assert "Smith" in entity_labels
    assert "Jane" in entity_labels
    assert "Doe" in entity_labels

def test_generate_chat_graph(knowledge_graph_service, sample_chat_history):
    """Test generating a knowledge graph from chat history."""
    # Generate graph
    graph_info = knowledge_graph_service.generate_chat_graph(
        sample_chat_history, 
        document_ids=["doc1", "doc2"],
        graph_name="test_chat_graph"
    )
    
    # Check graph info
    assert graph_info["name"] == "test_chat_graph"
    assert "id" in graph_info
    assert "file_path" in graph_info
    assert "visualization_path" in graph_info
    assert graph_info["node_count"] > 0
    assert graph_info["edge_count"] > 0
    
    # Check that files were created
    assert os.path.exists(graph_info["file_path"])
    assert os.path.exists(graph_info["visualization_path"])
    
    # Check JSON file content
    with open(graph_info["file_path"], 'r') as f:
        graph_data = json.load(f)
    
    assert graph_data["name"] == "test_chat_graph"
    assert graph_data["id"] == graph_info["id"]
    assert "document_ids" in graph_data
    assert "doc1" in graph_data["document_ids"]
    assert "doc2" in graph_data["document_ids"]
    assert "nodes" in graph_data
    assert "edges" in graph_data
    
    # Check that message nodes were created
    message_nodes = [node for node in graph_data["nodes"] if node["type"] == "user_message"]
    assert len(message_nodes) == 2
    
    # Check that response nodes were created
    response_nodes = [node for node in graph_data["nodes"] if node["type"] == "ai_response"]
    assert len(response_nodes) == 2
    
    # Check that document nodes were created
    document_nodes = [node for node in graph_data["nodes"] if node["type"] == "document"]
    assert len(document_nodes) == 2

def test_get_graph(knowledge_graph_service, sample_documents):
    """Test retrieving a knowledge graph by ID."""
    # Generate a graph first
    graph_info = knowledge_graph_service.generate_document_graph(sample_documents, "test_get_graph")
    graph_id = graph_info["id"]
    
    # Retrieve the graph
    graph_data = knowledge_graph_service.get_graph(graph_id)
    
    # Check that the retrieved data matches the original
    assert graph_data["id"] == graph_id
    assert graph_data["name"] == "test_get_graph"
    assert "document_ids" in graph_data
    assert "nodes" in graph_data
    assert "edges" in graph_data

def test_get_nonexistent_graph(knowledge_graph_service):
    """Test retrieving a nonexistent graph."""
    graph_data = knowledge_graph_service.get_graph("nonexistent_id")
    assert graph_data is None

def test_extract_entities_and_relationships(knowledge_graph_service):
    """Test entity and relationship extraction."""
    text = "John Smith and Jane Doe are involved in a legal case. The court ruled in favor of Smith."
    
    # Extract entities and relationships
    entities, relationships = knowledge_graph_service._extract_entities_and_relationships(text)
    
    # Check entities
    assert len(entities) >= 4  # John, Smith, Jane, Doe
    entity_labels = [entity["label"] for entity in entities]
    assert "John" in entity_labels
    assert "Smith" in entity_labels
    assert "Jane" in entity_labels
    assert "Doe" in entity_labels
    
    # Check relationships
    assert len(relationships) > 0

def test_extract_entities_from_text(knowledge_graph_service):
    """Test entity extraction from text."""
    text = "John Smith and Jane Doe are involved in a legal case."
    
    # Extract entities
    entities = knowledge_graph_service._extract_entities_from_text(text)
    
    # Check entities
    assert len(entities) >= 4  # John, Smith, Jane, Doe
    entity_labels = [entity["label"] for entity in entities]
    assert "John" in entity_labels
    assert "Smith" in entity_labels
    assert "Jane" in entity_labels
    assert "Doe" in entity_labels

def test_generate_visualization(knowledge_graph_service):
    """Test graph visualization generation."""
    # Create a simple graph
    G = nx.Graph()
    G.add_node("node1", label="Node 1", type="entity")
    G.add_node("node2", label="Node 2", type="entity")
    G.add_edge("node1", "node2", label="related_to")
    
    # Generate visualization
    graph_id = "test_visualization"
    knowledge_graph_service._generate_visualization(G, graph_id)
    
    # Check that the visualization file was created
    visualization_path = os.path.join(knowledge_graph_service.graph_dir, f"{graph_id}.png")
    assert os.path.exists(visualization_path) 
# Legal Mind Backend

A powerful backend service for legal document analysis and management.

## Overview

Legal Mind is a document analysis platform designed specifically for legal professionals. It provides tools for uploading, analyzing, and interacting with legal documents through AI-powered analysis and chat functionality.

## Features

- **Document Upload & Management**: Upload and manage legal documents in various formats (PDF, DOCX)
- **Document Analysis**: Analyze documents with different modes (standard, hypothetical, hierarchical)
- **AI-Powered Chat**: Interact with documents through a conversational interface
- **Metadata Extraction**: Automatically extract metadata from legal documents
- **Knowledge Graph Visualization**: Generate and visualize knowledge graphs from documents and chat sessions
- **RESTful API**: Well-structured API endpoints for integration with frontend applications

## Project Structure

```
backend/
├── app.py                 # Main application entry point
├── config.py              # Configuration settings
├── database.py            # Database connection and operations
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in version control)
├── models/                # Data models
├── services/              # Business logic services
│   ├── document_service.py    # Document processing
│   ├── analysis_service.py    # Document analysis
│   ├── chat_service.py        # Chat functionality
│   └── knowledge_graph_service.py  # Knowledge graph generation
├── utils/                 # Utility functions
├── uploads/               # Document storage
│   └── knowledge_graphs/  # Knowledge graph visualizations
└── tests/                 # Test suite
    ├── conftest.py            # Test configuration
    ├── test_app.py            # API tests
    ├── test_services.py       # Service tests
    └── test_files/            # Test document files
```

## Setup

### Prerequisites

- Python 3.8+
- MongoDB
- Virtual environment (recommended)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Monica-1107/legalmind.git
   cd legal-mind/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/legal_mind
   UPLOAD_FOLDER=uploads
   OPENROUTER_API_KEY=your_api_key
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   DEFAULT_MODEL=anthropic/claude-3-opus-20240229
   ```

5. Start the application:
   ```
   python app.py
   ```

## API Endpoints

### Health Check
- `GET /api/health`: Check if the API is running

### Document Management
- `POST /api/upload`: Upload a new document
- `GET /api/documents`: Get all documents
- `GET /api/documents/<doc_id>`: Get a specific document
- `GET /api/documents/<doc_id>/download`: Download a document

### Document Analysis
- `POST /api/documents/<doc_id>/analyze`: Analyze a document
  - Modes: standard, hypothetical, hierarchical
  - Levels: 1-3 (for hierarchical mode)

### Chat
- `POST /api/chat`: Chat with a document or get general legal advice

### Knowledge Graph
- `POST /api/documents/graph`: Generate a knowledge graph from one or more documents
- `POST /api/chat/graph`: Generate a knowledge graph from chat history
- `GET /api/graphs/<graph_id>`: Get a knowledge graph by ID
- `GET /api/graphs/<graph_id>/visualization`: Get the visualization image for a knowledge graph

## Knowledge Graph Feature

The knowledge graph feature provides two main functionalities:

1. **Document-based Knowledge Graphs**: Generate visual representations of the relationships between entities in one or more legal documents. This helps users understand the document structure and key relationships.

2. **Chat-based Knowledge Graphs**: Create graphs that visualize the flow of conversation and the entities mentioned during a chat session. This provides insights into the discussion and helps track important concepts.

Each chat response includes a "view graph" option that allows users to generate a knowledge graph based on the current chat session and referenced documents.

## Testing

Run the test suite:
```
python -m pytest
```

Run specific tests:
```
python -m pytest tests/test_app.py
```

## Deployment

For production deployment:

1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Use a production-grade WSGI server like Gunicorn:
   ```
   gunicorn app:app
   ```
4. Set up a reverse proxy (Nginx, Apache) for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE) 
# Legal Mind Backend API Documentation

## Overview
Legal Mind is an advanced legal document analysis system that provides intelligent document processing, query analysis, and knowledge graph generation for legal documents. This document provides comprehensive information about the backend API endpoints and integration guidelines.

## Table of Contents
1. [Setup](#setup)
2. [Environment Variables](#environment-variables)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Integration Guidelines](#integration-guidelines)
6. [Error Handling](#error-handling)

## Setup

### Prerequisites
- Python 3.8+
- MongoDB
- FAISS for vector similarity search
- Required Python packages (see requirements.txt)

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Environment Variables
```
MONGODB_URI=your_mongodb_uri
OPENROUTER_API_KEY=your_openrouter_api_key
UPLOAD_FOLDER=path_to_upload_folder
FAISS_INDEX_DIR=path_to_faiss_indices
DEFAULT_MODEL=your_preferred_model
NER_MODEL=en_core_web_sm
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

## API Endpoints

### Document Management

#### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

Parameters:
- file: File (PDF/DOCX)

Response:
{
    "document_id": "string",
    "filename": "string",
    "status": "success",
    "message": "string"
}
```

#### Get Document
```
GET /api/documents/{document_id}

Response:
{
    "document_id": "string",
    "filename": "string",
    "content": "string",
    "metadata": {
        "upload_date": "string",
        "file_type": "string",
        "size": "number"
    }
}
```

### Document Analysis

#### Analyze Document
```
POST /api/analysis/document/{document_id}

Parameters:
{
    "analysis_mode": "standard|hypothetical|hierarchical",
    "analysis_level": number (1-3, for hierarchical mode),
    "hypothetical_scenario": {
        "facts": "string",
        "arguments": "string",
        "precedents": "string"
    } (optional)
}

Response:
{
    "analysis_id": "string",
    "document_id": "string",
    "analysis_mode": "string",
    "content": "string",
    "timestamp": "string",
    "key_points": ["string"],
    "entities": {
        "PERSON": ["string"],
        "ORG": ["string"],
        "LAW": ["string"]
    }
}
```

#### Query Analysis
```
POST /api/analysis/query

Parameters:
{
    "query": "string",
    "document_id": "string",
    "query_type": "standard_analysis|legal_query"
}

Response:
{
    "is_relevant": boolean,
    "response": "string",
    "relevant_chunks": ["string"],
    "entities": {
        "PERSON": ["string"],
        "ORG": ["string"],
        "LAW": ["string"]
    }
}
```

### Knowledge Graph

#### Generate Document Graph
```
POST /api/graphs/document/{document_id}

Response:
{
    "graph_id": "string",
    "nodes": [
        {
            "id": "string",
            "label": "string",
            "type": "string"
        }
    ],
    "edges": [
        {
            "source": "string",
            "target": "string",
            "label": "string"
        }
    ]
}
```

#### Generate Chat Graph
```
POST /api/graphs/chat/{chat_session_id}

Response:
{
    "graph_id": "string",
    "nodes": [...],
    "edges": [...]
}
```

## Data Models

### Document Model
```typescript
interface Document {
    document_id: string;
    filename: string;
    content: string;
    metadata: {
        upload_date: string;
        file_type: string;
        size: number;
    };
    entities: {
        [entity_type: string]: string[];
    };
}
```

### Analysis Result Model
```typescript
interface AnalysisResult {
    analysis_id: string;
    document_id: string;
    analysis_mode: 'standard' | 'hypothetical' | 'hierarchical';
    content: string;
    timestamp: string;
    key_points?: string[];
    entities: {
        [entity_type: string]: string[];
    };
}
```

### Graph Model
```typescript
interface Graph {
    graph_id: string;
    nodes: Array<{
        id: string;
        label: string;
        type: string;
    }>;
    edges: Array<{
        source: string;
        target: string;
        label: string;
    }>;
}
```

## Integration Guidelines

### Authentication
- All API endpoints require an Authorization header with a Bearer token
- Token format: `Authorization: Bearer <your_api_token>`

### Error Handling
The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

Error responses follow this format:
```json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {}
    }
}
```

### Best Practices
1. **Document Processing**
   - Support for PDF and DOCX files only
   - Maximum file size: 10MB
   - Use document_id for all subsequent operations

2. **Query Analysis**
   - Keep queries focused and specific
   - Include relevant context in queries
   - Handle both relevant and irrelevant query responses

3. **Graph Visualization**
   - Use force-directed layout for graph rendering
   - Implement zoom and pan controls
   - Color-code different node types
   - Support graph export in various formats

4. **Performance Considerations**
   - Implement client-side caching for document content
   - Use pagination for large result sets
   - Handle long-running operations with progress indicators

## Example Integration Code

### Document Upload
```typescript
async function uploadDocument(file: File): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`
        },
        body: formData
    });

    return await response.json();
}
```

### Query Analysis
```typescript
async function analyzeQuery(query: string, documentId: string): Promise<AnalysisResponse> {
    const response = await fetch('/api/analysis/query', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query,
            document_id: documentId,
            query_type: 'standard_analysis'
        })
    });

    return await response.json();
}
```

### Graph Visualization
```typescript
function renderGraph(graphData: Graph) {
    // Example using D3.js
    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.edges).id(d => d.id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    // Add nodes and edges rendering code...
}
```

## Support
For technical support or questions, contact:
- Email: support@legalmind.app
- Documentation: https://docs.legalmind.app
- API Status: https://status.legalmind.app 
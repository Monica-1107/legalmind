from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import json
from bson import ObjectId

from database import (
    insert_document, get_document_by_id, get_all_documents, 
    update_document, insert_chat_message, get_chat_history,
    get_chat_history_by_session,
    db  # Add db import
)
from services.document_service import process_document
from services.analysis_service import analyze_document
from services.chat_service import generate_chat_response
from services.knowledge_graph_service import KnowledgeGraphService
from config import Config

# Custom JSON encoder to handle MongoDB ObjectId and datetime
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(MongoJSONEncoder, self).default(obj)

app = Flask(__name__)
app.config.from_object(Config)
app.json_encoder = MongoJSONEncoder

# Initialize extensions
CORS(app)

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize knowledge graph service
knowledge_graph_service = KnowledgeGraphService()

def get_db():
    """Get database instance"""
    return db

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle document upload"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        # Generate a unique filename
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Process the document (extract text, metadata, etc.)
        try:
            doc_info = process_document(file_path, original_filename)
            
            # Save document info to database
            doc_data = {
                "filename": original_filename,
                "file_path": file_path,
                "file_type": file_extension[1:],  # Remove the dot
                "content": doc_info.get('content', ''),
                "metadata": doc_info.get('metadata', {}),
                "created_at": datetime.now()
            }
            
            # Get database instance and insert document
            db = get_db()
            doc_id = db.documents.insert_one(doc_data).inserted_id
            
            return jsonify({
                "message": "File uploaded successfully",
                "document_id": str(doc_id),
                "filename": original_filename,
                "file_size": os.path.getsize(file_path),
                "upload_date": datetime.now().isoformat()
            }), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "File upload failed"}), 400

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Get all documents"""
    docs = get_all_documents()
    return jsonify({
        "documents": [
            {
                "id": str(doc["_id"]),
                "filename": doc["filename"],
                "file_type": doc.get('metadata', {}).get('file_type', doc.get('file_type', 'unknown')),
                "upload_date": doc["created_at"].isoformat(),
                "file_size": os.path.getsize(doc["file_path"]) if os.path.exists(doc["file_path"]) else 0
            } for doc in docs
        ]
    })

@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_document(doc_id):
    """Get document details"""
    doc = get_document_by_id(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
    return jsonify({
        "id": str(doc["_id"]),
        "filename": doc["filename"],
        "file_type": doc['metadata']["file_type"],
        "upload_date": doc["created_at"].isoformat(),
        "file_size": os.path.getsize(doc["file_path"]) if os.path.exists(doc["file_path"]) else 0,
        "metadata": doc.get("metadata", {})
    })

@app.route('/api/documents/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    """Download a document"""
    doc = get_document_by_id(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
        
    directory = os.path.dirname(doc["file_path"])
    filename = os.path.basename(doc["file_path"])
    return send_from_directory(directory, filename, as_attachment=True, download_name=doc["filename"])

@app.route('/api/documents/<doc_id>/analyze', methods=['POST'])
def analyze_document_endpoint(doc_id):
    """Analyze a document"""
    doc = get_document_by_id(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
    
    data = request.json
    analysis_mode = data.get('mode', 'standard')
    analysis_level = data.get('level', 1)
    hypothetical_scenario = data.get('hypothetical_scenario', {})
    
    try:
        analysis_result = analyze_document(
            doc["file_path"], 
            doc["content"],
            analysis_mode=analysis_mode,
            analysis_level=analysis_level,
            hypothetical_scenario=hypothetical_scenario
        )
        
        # Update document with analysis results
        update_document(doc_id, {
            "analysis_results": analysis_result,
            "last_analyzed": datetime.now()
        })
        
        return jsonify({
            "document_id": doc_id,
            "analysis_mode": analysis_mode,
            "analysis_level": analysis_level,
            "results": analysis_result
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with a document"""
    data = request.json
    document_id = data.get('document_id')
    message = data.get('message')
    chat_history = data.get('chat_history', [])
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # If document_id is provided, retrieve the document
        doc = None
        if document_id:
            doc = get_document_by_id(document_id)
            if not doc:
                return jsonify({"error": "Document not found"}), 404
        
        # Generate response
        response = generate_chat_response(
            message, 
            chat_history, 
            document_content=doc["content"] if doc else None,
            document_id=document_id
        )
        
        # Save chat message to database
        message_id = insert_chat_message({
            "document_id": document_id,
            "session_id": data.get('session_id'),
            "user_message": message,
            "ai_response": response["text"],
            "metadata": response.get("metadata", {})
        })
        
        return jsonify({
            "response": response["text"],
            "message_id": message_id,
            "timestamp": datetime.now().isoformat(),
            "metadata": response.get("metadata", {})
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/graph', methods=['POST'])
def create_document_graph():
    """Create a knowledge graph from one or more documents"""
    data = request.json
    document_ids = data.get('document_ids', [])
    graph_name = data.get('graph_name')
    
    if not document_ids:
        return jsonify({"error": "No document IDs provided"}), 400
    
    # Get documents from database
    documents = []
    for doc_id in document_ids:
        doc = get_document_by_id(doc_id)
        if doc:
            documents.append(doc)
    
    if not documents:
        return jsonify({"error": "No valid documents found"}), 404
    
    # Generate knowledge graph
    try:
        graph_info = knowledge_graph_service.generate_document_graph(documents, graph_name)
        return jsonify(graph_info), 201
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error creating document graph: {error_details}")
        return jsonify({"error": str(e), "details": error_details}), 500

@app.route('/api/chat/graph', methods=['POST'])
def create_chat_graph():
    """Create a knowledge graph from chat history"""
    data = request.json
    chat_session_id = data.get('chat_session_id')
    document_ids = data.get('document_ids', [])
    graph_name = data.get('graph_name')
    
    if not chat_session_id:
        return jsonify({"error": "No chat session ID provided"}), 400
    
    # Get chat history from database
    chat_history = get_chat_history_by_session(chat_session_id)
    
    if not chat_history:
        return jsonify({"error": "No chat history found"}), 404
    
    # Generate knowledge graph
    try:
        graph_info = knowledge_graph_service.generate_chat_graph(
            chat_history, 
            document_ids=document_ids,
            graph_name=graph_name
        )
        return jsonify(graph_info), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/graphs/<graph_id>', methods=['GET'])
def get_graph(graph_id):
    """Get a knowledge graph by ID"""
    graph_data = knowledge_graph_service.get_graph(graph_id)
    
    if not graph_data:
        return jsonify({"error": "Graph not found"}), 404
    
    return jsonify(graph_data)

@app.route('/api/graphs/<graph_id>/visualization', methods=['GET'])
def get_graph_visualization(graph_id):
    """Get the visualization image for a knowledge graph"""
    graph_data = knowledge_graph_service.get_graph(graph_id)
    
    if not graph_data:
        return jsonify({"error": "Graph not found"}), 404
    
    visualization_path = os.path.join(
        knowledge_graph_service.graph_dir, 
        f"{graph_id}.png"
    )
    
    if not os.path.exists(visualization_path):
        return jsonify({"error": "Visualization not found"}), 404
    
    return send_from_directory(
        knowledge_graph_service.graph_dir, 
        f"{graph_id}.png", 
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True)
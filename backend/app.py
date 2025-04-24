from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import json
from bson import ObjectId
from functools import wraps

from database import (
    insert_document, get_document_by_id, get_all_documents, 
    update_document, insert_chat_message, get_chat_history,
    get_chat_history_by_session,
    db  # Add db import
)
from services.document_service import process_document
from services.analysis_service import analyze_document
from services.chat_service import (
    generate_chat_response, create_chat_session, get_chat_session,
    get_chat_sessions_by_user, send_chat_message, get_chat_messages
)
from services.knowledge_graph_service import KnowledgeGraphService
from services.user_service import (
    register_user, login_user, get_user_by_id, update_user_profile,
    change_password
)
from services.file_service import (
    save_file, get_file_by_id, get_files_by_user, delete_file
)
from models.user import User
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

# Initialize extensions with CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "multipart/form-data"],
        "supports_credentials": True
    }
})

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize knowledge graph service
knowledge_graph_service = KnowledgeGraphService()

def get_db():
    """Get database instance"""
    return db

def update_file_metadata(file_id, metadata):
    """Update file metadata"""
    return db.files.update_one(
        {"_id": file_id},
        {"$set": metadata}
    )

def convert_mongo_doc_for_json(doc):
    """Convert MongoDB document for JSON serialization by converting ObjectId to string"""
    if not doc:
        return doc
        
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, list):
            result[key] = [convert_mongo_doc_for_json(item) if isinstance(item, dict) else 
                          str(item) if isinstance(item, ObjectId) else item for item in value]
        elif isinstance(value, dict):
            result[key] = convert_mongo_doc_for_json(value)
        else:
            result[key] = value
    return result

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        # Verify token
        payload = User.verify_token(token)
        if not payload:
            return jsonify({'message': 'Token is invalid or expired'}), 401
        
        # Add user_id to kwargs
        kwargs['user_id'] = payload['user_id']
        
        return f(*args, **kwargs)
    
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

# User authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required"}), 400
    
    result, error = register_user(
        email=data.get('email'),
        password=data.get('password'),
        name=data.get('name')
    )
    
    if error:
        return jsonify({"message": error}), 400
    
    return jsonify(result), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required"}), 400
    
    result, error = login_user(
        email=data.get('email'),
        password=data.get('password')
    )
    
    if error:
        return jsonify({"message": error}), 401
    
    return jsonify(result), 200

@app.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Get user profile"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify(convert_mongo_doc_for_json(user.to_dict())), 200

@app.route('/api/auth/profile', methods=['PUT'])
@token_required
def update_profile(user_id):
    """Update user profile"""
    data = request.json
    
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    user = update_user_profile(user_id, data)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify(convert_mongo_doc_for_json(user.to_dict())), 200

@app.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_user_password(user_id):
    """Change user password"""
    data = request.json
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({"message": "Current password and new password are required"}), 400
    
    result, error = change_password(
        user_id=user_id,
        current_password=data.get('current_password'),
        new_password=data.get('new_password')
    )
    
    if error:
        return jsonify({"message": error}), 400
    
    return jsonify({"message": "Password changed successfully"}), 200

# File management endpoints
@app.route('/api/files', methods=['GET'])
@token_required
def get_user_files(user_id):
    """Get all files for a user"""
    files = get_files_by_user(user_id)
    return jsonify([convert_mongo_doc_for_json(file) for file in files]), 200

@app.route('/api/files/<file_id>', methods=['GET'])
@token_required
def get_file(file_id, user_id):
    """Get a file by ID"""
    file_data = get_file_by_id(ObjectId(file_id))
    if not file_data:
        return jsonify({"message": "File not found"}), 404
    
    # Check if user has access to the file
    if file_data.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    return jsonify(convert_mongo_doc_for_json(file_data)), 200

@app.route('/api/files/<file_id>', methods=['DELETE'])
@token_required
def delete_user_file(file_id, user_id):
    """Delete a file"""
    file_data = get_file_by_id(ObjectId(file_id))
    if not file_data:
        return jsonify({"message": "File not found"}), 404
    
    # Check if user has access to the file
    if file_data.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    success = delete_file(ObjectId(file_id))
    if not success:
        return jsonify({"message": "Failed to delete file"}), 500
    
    return jsonify({"message": "File deleted successfully"}), 200

# Chat session endpoints
@app.route('/api/chat/sessions', methods=['GET'])
@token_required
def get_user_chat_sessions(user_id):
    """Get all chat sessions for a user"""
    sessions = get_chat_sessions_by_user(user_id)
    return jsonify([convert_mongo_doc_for_json(session) for session in sessions]), 200

@app.route('/api/chat/sessions', methods=['POST'])
@token_required
def create_user_chat_session(user_id):
    """Create a new chat session"""
    data = request.json
    title = data.get('title') if data else None
    
    session = create_chat_session(user_id, title)
    return jsonify(convert_mongo_doc_for_json(session)), 201

@app.route('/api/chat/sessions/<session_id>', methods=['GET'])
@token_required
def get_user_chat_session(session_id, user_id):
    """Get a chat session by ID"""
    session = get_chat_session(ObjectId(session_id))
    if not session:
        return jsonify({"message": "Chat session not found"}), 404
    
    # Check if user has access to the session
    if session.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    return jsonify(convert_mongo_doc_for_json(session)), 200

@app.route('/api/chat/sessions/<session_id>', methods=['DELETE'])
@token_required
def delete_user_chat_session(session_id, user_id):
    """Delete a chat session"""
    session = get_chat_session(ObjectId(session_id))
    if not session:
        return jsonify({"message": "Chat session not found"}), 404
    
    # Check if user has access to the session
    if session.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    success = delete_chat_session(ObjectId(session_id))
    if not success:
        return jsonify({"message": "Failed to delete chat session"}), 500
    
    return jsonify({"message": "Chat session deleted successfully"}), 200

@app.route('/api/chat/sessions/<session_id>/messages', methods=['GET'])
@token_required
def get_session_messages(session_id, user_id):
    """Get all messages for a chat session"""
    session = get_chat_session(ObjectId(session_id))
    if not session:
        return jsonify({"message": "Chat session not found"}), 404
    
    # Check if user has access to the session
    if session.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    messages = get_chat_messages(session_id)
    return jsonify([convert_mongo_doc_for_json(message) for message in messages]), 200

@app.route('/api/chat/sessions/<session_id>/messages', methods=['POST'])
@token_required
def send_session_message(session_id, user_id):
    """Send a message to a chat session"""
    data = request.json
    
    if not data or not data.get('content'):
        return jsonify({"message": "Message content is required"}), 400
    
    message, error = send_chat_message(
        session_id=session_id,
        user_id=user_id,
        content=data.get('content'),
        document_id=data.get('document_id')
    )
    
    if error:
        return jsonify({"message": error}), 400
    
    # Generate AI response if needed
    if data.get('generate_response', True):
        # Get chat history
        chat_history = get_chat_messages(session_id)
        
        # Get document content if document_id is provided
        document_content = None
        if data.get('document_id'):
            document = get_document_by_id(data.get('document_id'))
            if document and 'content' in document:
                document_content = document['content']
        
        # Generate response
        try:
            response_content = generate_chat_response(
                message=data.get('content'),
                chat_history=chat_history,
                document_content=document_content,
                document_id=data.get('document_id')
            )
            
            # Save AI response
            ai_message, _ = send_chat_message(
                session_id=session_id,
                user_id=user_id,
                content=response_content,
                role="assistant",
                document_id=data.get('document_id')
            )
            
            return jsonify({
                "user_message": convert_mongo_doc_for_json(message),
                "ai_message": convert_mongo_doc_for_json(ai_message)
            }), 201
        except Exception as e:
            return jsonify({
                "user_message": convert_mongo_doc_for_json(message),
                "error": str(e)
            }), 201
    
    return jsonify({"message": convert_mongo_doc_for_json(message)}), 201

# Existing endpoints
@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(user_id):
    """Upload a file"""
    print("Uploading file", request.files)
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    # Save file
    file_data = save_file(file, user_id)
    
    # Convert file_data for JSON serialization
    file_data = convert_mongo_doc_for_json(file_data)
    
    # Process document if it's a PDF or DOCX
    if file_data['file_type'] in ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        try:
            # Process document
            doc_id = process_document(file_data['file_path'], file_data['file_type'])
            
            # Update file with document ID
            update_file_metadata(ObjectId(file_data['_id']), {"document_id": doc_id})
            
            # Get document
            document = get_document_by_id(doc_id)
            
            # Convert for JSON serialization
            document = convert_mongo_doc_for_json(document)
            
            return jsonify({
                "file": file_data,
                "document": document
            }), 201
        except Exception as e:
            print(f"Error processing document: {str(e)}")
            return jsonify({
                "file": file_data,
                "error": str(e)
            }), 201
    
    return jsonify({"file": file_data}), 201

@app.route('/api/documents', methods=['GET'])
@token_required
def get_documents(user_id):
    """Get all documents for a user"""
    # Get all files for the user
    files = get_files_by_user(user_id)
    
    # Get document IDs
    document_ids = [file.get('document_id') for file in files if file.get('document_id')]
    
    # Get documents
    documents = []
    for doc_id in document_ids:
        doc = get_document_by_id(doc_id)
        if doc:
            documents.append(convert_mongo_doc_for_json(doc))
    
    return jsonify(documents), 200

@app.route('/api/documents/<doc_id>', methods=['GET'])
@token_required
def get_document(doc_id, user_id):
    """Get a document by ID"""
    # Get document
    document = get_document_by_id(doc_id)
    if not document:
        return jsonify({"message": "Document not found"}), 404
    
    # Check if user has access to the document
    files = get_files_by_user(user_id)
    file_ids = [str(file.get('_id')) for file in files]
    
    # Get file with this document ID
    file_with_doc = None
    for file in files:
        if file.get('document_id') == doc_id:
            file_with_doc = file
            break
    
    if not file_with_doc:
        return jsonify({"message": "Access denied"}), 403
    
    return jsonify(convert_mongo_doc_for_json(document)), 200

@app.route('/api/documents/<doc_id>/download', methods=['GET'])
@token_required
def download_document(doc_id, user_id):
    """Download a document"""
    # Get document
    document = get_document_by_id(doc_id)
    if not document:
        return jsonify({"message": "Document not found"}), 404
    
    # Check if user has access to the document
    files = get_files_by_user(user_id)
    
    # Get file with this document ID
    file_with_doc = None
    for file in files:
        if file.get('document_id') == doc_id:
            file_with_doc = file
            break
    
    if not file_with_doc:
        return jsonify({"message": "Access denied"}), 403
    
    return send_from_directory(
        os.path.dirname(file_with_doc['file_path']),
        os.path.basename(file_with_doc['file_path']),
        as_attachment=True
    )

@app.route('/api/documents/<doc_id>/analyze', methods=['POST'])
@token_required
def analyze_document_endpoint(doc_id, user_id):
    """Analyze a document"""
    # Get document
    document = get_document_by_id(doc_id)
    if not document:
        return jsonify({"message": "Document not found"}), 404
    a=request.json
    print(a.keys(),a["analysis_level"])
    # Check if user has access to the document
    file_with_doc = db.files.find_one({
        "document_id": doc_id,
        "user_id": user_id
    })
    if not file_with_doc:
        return jsonify({"message": "Access denied"}), 403
    
    try:
        # Analyze document
        analysis = analyze_document(doc_id,analysis_mode=a["analysis_mode"],content=document["content"],analysis_level=a["analysis_level"] or 1)
        print(analysis)
        # Update document with analysis
        update_document(doc_id, {"analysis": analysis})
        
        # Get updated document
        document = get_document_by_id(doc_id)
        
        return jsonify(convert_mongo_doc_for_json(document)), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(user_id):
    """Chat with the AI"""
    data = request.json
    if not data or not data.get('message'):
        return jsonify({"message": "Message is required"}), 400
    mode=data.get('mode')
    message = data.get('message')
    document_id = data.get('document_id')
    hypothetical = data.get('hypothetical', False)
    session_id = data.get('session_id')
    try:
        if session_id:
            # Get session
            session = get_chat_session(session_id)
            if not session:
                return jsonify({"message": "Session not found"}), 404
            
            # Check if user has access to the session
            if session.get('user_id') != user_id:
                return jsonify({"message": "Access denied"}), 403
        
        # Generate response
        response = generate_chat_response(message=message, document_id=document_id,mode=mode)#session_id=session_id
        
        #return jsonify(convert_mongo_doc_for_json(response)), 200
        return jsonify(response['text']), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route('/api/graphs/document', methods=['POST'])
@token_required
def create_document_graph(user_id):
    """Create a document graph"""
    data = request.json
    
    if not data or not data.get('document_id'):
        return jsonify({"message": "Document ID is required"}), 400
    
    document_id = data.get('document_id')
    # Get document
    document = get_document_by_id(document_id)
    if not document:
        return jsonify({"message": "Document not found"}), 404
    # Check if user has access to the document
    file_with_doc = db.files.find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not file_with_doc:
        return jsonify({"message": "Access denied"}), 403
    
    try:
        # Create graph
        graph_data = knowledge_graph_service.generate_document_graph(
            documents=[document]
        )
        print(graph_data)
        return jsonify(graph_data), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route('/api/graphs/chat', methods=['POST'])
@token_required
def create_chat_graph(user_id):
    """Create a chat graph"""
    data = request.json
    
    if not data or not data.get('session_id'):
        return jsonify({"message": "Session ID is required"}), 400
    
    session_id = data.get('session_id')
    graph_type = data.get('graph_type', 'concept')
    
    # Get session
    session = get_chat_session(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404
    
    # Check if user has access to the session
    if session.get('user_id') != user_id:
        return jsonify({"message": "Access denied"}), 403
    
    try:
        # Create graph
        graph_data = knowledge_graph_service.create_chat_graph(
            session_id=session_id,
            graph_type=graph_type
        )
        
        return jsonify(convert_mongo_doc_for_json(graph_data)), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route('/api/graphs/<graph_id>', methods=['GET'])
@token_required
def get_graph(graph_id, user_id):
    """Get a graph by ID"""
    graph = knowledge_graph_service.get_graph(graph_id)
    if not graph:
        return jsonify({"message": "Graph not found"}), 404
    
    return jsonify(convert_mongo_doc_for_json(graph)), 200

@app.route('/api/graphs/<graph_id>/visualization', methods=['GET'])
@token_required
def get_graph_visualization(graph_id, user_id):
    """Get a graph visualization"""
    try:
        visualization_path = knowledge_graph_service.get_graph_visualization(graph_id)
        if not visualization_path:
            return jsonify({"message": "Graph visualization not found"}), 404
        
        return send_from_directory(
            os.path.dirname(visualization_path),
            os.path.basename(visualization_path)
        )
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# --- User Activity Endpoint ---
@app.route('/api/user/activity', methods=['GET'])
@token_required
def get_user_activity(user_id):
    """Get recent activity for a user (uploads, analysis, chat, etc.)"""
    # Get recent files
    files = get_files_by_user(user_id)
    file_activities = [
        {
            "id": str(file['_id']),
            "type": "upload",
            "description": f"Uploaded file: {file.get('filename', 'Untitled')}",
            "time": file.get('uploaded_at', file.get('created_at', None)),
        }
        for file in files
    ]
    # Get chat sessions
    sessions = get_chat_sessions_by_user(user_id)
    chat_activities = [
        {
            "id": str(session['_id']),
            "type": "chat",
            "description": f"Chat session: {session.get('title', 'Untitled')}",
            "time": session.get('created_at', None),
        }
        for session in sessions
    ]
    # Get analyzed documents (if you track them, else skip)
    # You can expand this section to include more types of activities.
    all_activities = file_activities + chat_activities
    # Sort by time (descending)
    all_activities = [a for a in all_activities if a['time']]
    all_activities.sort(key=lambda x: x['time'], reverse=True)
    # Format time as ISO8601 for frontend
    for a in all_activities:
        if a['time']:
            a['time'] = a['time'].isoformat() if hasattr(a['time'], 'isoformat') else str(a['time'])
    return jsonify(all_activities[:12]), 200

# --- User Saved Documents Endpoint ---
@app.route('/api/user/documents', methods=['GET'])
@token_required
def get_user_saved_documents(user_id):
    """Get saved documents for a user (for dashboard)"""
    files = get_files_by_user(user_id)
    saved_docs = []
    for file in files:
        if file.get('document_id'):
            doc = get_document_by_id(file.get('document_id'))
            if doc:
                saved_docs.append({
                    "id": str(doc['_id']),
                    "title": doc.get('title', file.get('filename', 'Untitled')),
                    "filename": file.get('filename', ''),
                    "uploaded_at": file.get('uploaded_at', file.get('created_at', None)),
                })
    saved_docs.sort(key=lambda x: x['uploaded_at'], reverse=True)
    for d in saved_docs:
        if d['uploaded_at']:
            d['uploaded_at'] = d['uploaded_at'].isoformat() if hasattr(d['uploaded_at'], 'isoformat') else str(d['uploaded_at'])
    return jsonify(saved_docs[:10]), 200

# --- User Analytics Endpoint ---
@app.route('/api/user/analytics', methods=['GET'])
@token_required
def get_user_analytics(user_id):
    """Get analytics for dashboard (documents analyzed, chat sessions, scenarios, etc)"""
    files = get_files_by_user(user_id)
    docs = [file for file in files if file.get('document_id')]
    sessions = get_chat_sessions_by_user(user_id)
    # For hypothetical scenarios, use 0 or query if you track them
    analytics = {
        "documents_analyzed": len(docs),
        "chat_sessions": len(sessions),
        "hypothetical_scenarios": 0
    }
    return jsonify(analytics), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
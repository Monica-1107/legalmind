from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
from config import Config

# Initialize MongoDB client
client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB_NAME]

# Collections
documents = db.documents
chat_messages = db.chat_messages

# Helper functions for document operations
def insert_document(doc_data):
    """Insert a new document into the database"""
    doc_data['created_at'] = datetime.now()
    result = documents.insert_one(doc_data)
    return str(result.inserted_id)

def get_document_by_id(doc_id):
    """Get a document by ID"""
    try:
        return documents.find_one({"_id": ObjectId(doc_id)})
    except:
        return None

def get_all_documents():
    """Get all documents"""
    return list(documents.find().sort("created_at", -1))

def update_document(doc_id, update_data):
    """Update a document"""
    documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": update_data}
    )

# Helper functions for chat operations
def insert_chat_message(message_data):
    """Insert a new chat message"""
    message_data['created_at'] = datetime.now()
    result = chat_messages.insert_one(message_data)
    return str(result.inserted_id)

def get_chat_history(document_id=None, limit=50):
    """Get chat history for a document"""
    query = {"document_id": document_id} if document_id else {}
    return list(chat_messages.find(query).sort("created_at", -1).limit(limit))

def get_chat_history_by_session(session_id, limit=50):
    """Get chat history for a session"""
    query = {"session_id": session_id} if session_id else {}
    return list(chat_messages.find(query).sort("created_at", -1).limit(limit))
import requests
import json
from config import Config
from datetime import datetime
from bson import ObjectId
from database import db, get_document_by_id

# Collections
chat_sessions = db.chat_sessions
chat_messages = db.chat_messages

def generate_chat_response(message, chat_history=None, document_content=None, document_id=None,mode="standard"):
    """
    Generate a response to a chat message, optionally in the context of a document
    
    Args:
        message (str): User's message
        chat_history (list): Previous chat messages
        document_content (str): Document content for context
        document_id (str): ID of the document being discussed
        
    Returns:
        dict: Response containing text and metadata
    """
    if not chat_history:
        chat_history = []
    if document_content is None and document_id:
        document_content = get_document_by_id(document_id).get('content', None)
    print(mode)
    # Format chat history for the prompt
    history_str = ""
    for i in range(0, len(chat_history), 2):
        if i+1 < len(chat_history):
            history_str += f"User: {chat_history[i]}\nAI: {chat_history[i+1]}\n\n"
    if mode=="standard":
        persona='general_citizens'
        traits='donot know much about law and want it simple'
    elif mode=="hierarchical":
        persona='legal_professionals'
        traits='highly knowledgeable about law and want it complex'
    else:
        persona='law_students'
        traits='curious to learn about law and want it explained to improve their understanding'
    # Create the prompt
    if document_content:
        # If we have document content, include it in the prompt
        prompt = f"""
        You are a legal assistant for {persona} having traits: {traits}, analyzing a document and answering questions about it.
        
        Document content (for reference):
        {document_content}  # Truncate if too long
        
        Chat history:
        {history_str}
        
        User: {message}
        
        Please provide a helpful, accurate response based on the document content.
        """
    else:
        # General legal chat
        prompt = f"""
        You are a legal assistant providing information and guidance on legal matters. 
        You should be helpful, professional, and informative, but remember to clarify that 
        you're not providing legal advice that replaces consultation with a qualified attorney.
        
        Chat history:
        {history_str}
        
        User: {message}
        """
    print(prompt)
    # Call OpenRouter API
    response_text = call_openrouter_api(prompt)
    
    # Create response object with metadata
    response = {
        "text": response_text,
        "metadata": {
            "has_graph_option": True,
            "document_id": document_id
        }
    }
    
    return response

def call_openrouter_api(prompt):
    """Call OpenRouter API to generate text"""
    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://legalmind.app"  # Replace with your actual domain
    }
    
    data = {
        "model": Config.DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": "You are a legal assistant providing information on legal matters. Be helpful, professional, and informative."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,  # Higher temperature for more creative responses in chat
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(
            Config.OPENROUTER_API_URL,
            headers=headers,
            json=data
        )
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        raise Exception(f"Error calling OpenRouter API: {str(e)}")

def create_chat_session(user_id, title=None):
    """Create a new chat session"""
    session_data = {
        "user_id": user_id,
        "title": title or f"Chat Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_active": True
    }
    
    result = chat_sessions.insert_one(session_data)
    session_data["_id"] = result.inserted_id
    
    return session_data

def get_chat_session(session_id):
    """Get a chat session by ID"""
    try:
        return chat_sessions.find_one({"_id": ObjectId(session_id)})
    except:
        return None

def get_chat_sessions_by_user(user_id):
    """Get all chat sessions for a user"""
    return list(chat_sessions.find({"user_id": user_id}).sort("updated_at", -1))

def update_chat_session(session_id, update_data):
    """Update a chat session"""
    update_data["updated_at"] = datetime.now()
    
    chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_data}
    )
    
    return get_chat_session(session_id)

def delete_chat_session(session_id):
    """Delete a chat session and all its messages"""
    # Delete session
    chat_sessions.delete_one({"_id": ObjectId(session_id)})
    
    # Delete all messages in the session
    chat_messages.delete_many({"session_id": session_id})
    
    return True

def send_chat_message(session_id, user_id, content, role="user", document_id=None):
    """Send a chat message"""
    # Check if session exists
    session = get_chat_session(session_id)
    if not session:
        return None, "Chat session not found"
    
    # Create message
    message_data = {
        "session_id": session_id,
        "user_id": user_id,
        "content": content,
        "role": role,
        "document_id": document_id,
        "created_at": datetime.now()
    }
    
    # Insert into database
    result = chat_messages.insert_one(message_data)
    message_data["_id"] = result.inserted_id
    
    # Update session
    update_chat_session(session_id, {"last_message": content})
    
    return message_data, None

def get_chat_messages(session_id, limit=50):
    """Get chat messages for a session"""
    return list(chat_messages.find({"session_id": session_id}).sort("created_at", 1).limit(limit))

def get_chat_messages_by_document(document_id, limit=50):
    """Get chat messages for a document"""
    return list(chat_messages.find({"document_id": document_id}).sort("created_at", 1).limit(limit))
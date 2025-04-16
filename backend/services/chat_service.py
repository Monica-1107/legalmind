import requests
import json
from config import Config

def generate_chat_response(message, chat_history=None, document_content=None, document_id=None):
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
    
    # Format chat history for the prompt
    history_str = ""
    for i in range(0, len(chat_history), 2):
        if i+1 < len(chat_history):
            history_str += f"User: {chat_history[i]}\nAI: {chat_history[i+1]}\n\n"
    
    # Create the prompt
    if document_content:
        # If we have document content, include it in the prompt
        prompt = f"""
        You are a legal assistant analyzing a document and answering questions about it.
        
        Document content (for reference):
        {document_content[:10000]}  # Truncate if too long
        
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
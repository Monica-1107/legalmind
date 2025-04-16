import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # MongoDB configuration
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/legalmind')
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'legalmind')
    
    # File upload configuration
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    # OpenRouter API configuration
    OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
    DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL', 'anthropic/claude-3-opus')
    
    # Analysis configuration
    DEFAULT_ANALYSIS_MODE = 'standard'
    DEFAULT_ANALYSIS_LEVEL = 1
    
    # Advanced Analysis Configuration
    # Embedding model
    EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
    
    # Text chunking parameters
    CHUNK_SIZE = int(os.environ.get('CHUNK_SIZE', '500'))
    CHUNK_OVERLAP = int(os.environ.get('CHUNK_OVERLAP', '100'))
    
    # FAISS index settings
    FAISS_INDEX_DIR = os.environ.get('FAISS_INDEX_DIR', os.path.join(os.getcwd(), 'faiss_indices'))
    
    # NER model
    NER_MODEL = os.environ.get('NER_MODEL', 'en_legal_ner_trf')
    
    # LLM model for analysis
    ANALYSIS_MODEL = os.environ.get('ANALYSIS_MODEL', 'meta-llama/llama-3-70b-instruct')
    
    # Similarity threshold for document relevance
    SIMILARITY_THRESHOLD = float(os.environ.get('SIMILARITY_THRESHOLD', '0.7'))
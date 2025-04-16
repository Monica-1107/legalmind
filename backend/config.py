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
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'e89f9a5a0876dbe30c5c724598e67ec5773f27dcd8db9b56c5c2f97e8a5b98f6')
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/legalmind')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    MONGODB_URI = os.getenv('MONGODB_URI_TEST', 'mongodb://localhost:27017/legalmind_test')

class ProductionConfig(Config):
    """Production configuration"""
    # Production-specific settings
    pass

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])


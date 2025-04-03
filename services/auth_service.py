import bcrypt
from flask_jwt_extended import create_access_token
from models.user import User
from datetime import datetime

class AuthService:
    """Service for handling authentication logic"""
    
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def check_password(password, hashed_password):
        """Check if a password matches the hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def register_user(email, password, first_name=None, last_name=None):
        """Register a new user"""
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return None
        
        # Hash password and create user
        hashed_password = AuthService.hash_password(password)
        user = User.create(email, hashed_password, first_name, last_name)
        return user
    
    @staticmethod
    def login_user(email, password):
        """Authenticate a user and return JWT token"""
        user = User.find_by_email(email)
        
        if not user or not AuthService.check_password(password, user['password']):
            return None
        
        # Create access token
        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims={
                "email": user['email'],
                "first_name": user.get('first_name'),
                "last_name": user.get('last_name')
            }
        )
        
        return {
            "token": access_token,
            "user": {
                "id": str(user['_id']),
                "email": user['email'],
                "first_name": user.get('first_name'),
                "last_name": user.get('last_name')
            }
        }


from datetime import datetime
from bson import ObjectId
import bcrypt
import jwt
from config import Config

class User:
    def __init__(self, email, password, name=None, role="user"):
        self.email = email
        self.password = password
        self.name = name or email.split('@')[0]
        self.role = role
        self.created_at = datetime.now()
        self.last_login = None
        
    def to_dict(self):
        return {
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
    
    @staticmethod
    def from_dict(data):
        user = User(
            email=data.get("email", ""),
            password=data.get("password", ""),
            name=data.get("name"),
            role=data.get("role", "user")
        )
        if "_id" in data:
            user.id = str(data["_id"])
        if "created_at" in data:
            user.created_at = data["created_at"]
        if "last_login" in data:
            user.last_login = data["last_login"]
        return user
    
    def hash_password(self):
        """Hash the password using bcrypt"""
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(self.password.encode('utf-8'), salt)
        return self
    
    def check_password(self, password):
        """Check if the provided password matches the hashed password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password)
    
    def generate_token(self):
        """Generate a JWT token for the user"""
        payload = {
            "user_id": str(self.id) if hasattr(self, 'id') else None,
            "email": self.email,
            "role": self.role,
            "exp": datetime.utcnow().timestamp() + 86400  # 24 hours
        }
        return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")
    
    @staticmethod
    def verify_token(token):
        """Verify a JWT token and return the payload"""
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None 
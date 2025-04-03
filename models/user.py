from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI')
client = MongoClient(mongo_uri)
db = client.legalmind

# Ensure index on email for fast lookups
db.users.create_index("email", unique=True)

class User:
    """User model for MongoDB"""
    
    @staticmethod
    def create(email, hashed_password, first_name=None, last_name=None):
        """Create a new user"""
        user = {
            "email": email,
            "password": hashed_password,
            "first_name": first_name,
            "last_name": last_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            result = db.users.insert_one(user)
            user['_id'] = str(result.inserted_id)
            return user
        except Exception as e:
            # Handle duplicate key error (email already exists)
            if 'duplicate key error' in str(e):
                return None
            raise
    
    @staticmethod
    def find_by_email(email):
        """Find a user by email"""
        user = db.users.find_one({"email": email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID"""
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except:
            return None
    
    @staticmethod
    def update(user_id, update_data):
        """Update user details"""
        update_data['updated_at'] = datetime.utcnow()
        
        try:
            result = db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete(user_id):
        """Delete a user"""
        try:
            result = db.users.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False

# Fix missing import
from datetime import datetime


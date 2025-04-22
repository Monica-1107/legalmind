from datetime import datetime
from bson import ObjectId
from models.user import User
from database import db

# Collection for users
users = db.users

def register_user(email, password, name=None):
    """Register a new user"""
    # Check if user already exists
    if users.find_one({"email": email}):
        return None, "User with this email already exists"
    
    # Create and hash password
    user = User(email, password, name)
    user.hash_password()
    
    # Insert into database
    user_data = user.to_dict()
    user_data["password"] = user.password
    result = users.insert_one(user_data)
    
    # Set user ID
    user.id = str(result.inserted_id)
    
    # Generate token
    token = user.generate_token()
    
    return {"user": user.to_dict(), "token": token}, None

def login_user(email, password):
    """Login a user and return a token"""
    # Find user by email
    user_data = users.find_one({"email": email})
    if not user_data:
        return None, "User not found"
    
    # Create user object
    user = User.from_dict(user_data)
    user.password = user_data["password"]
    
    # Check password
    if not user.check_password(password):
        return None, "Invalid password"
    
    # Update last login
    users.update_one(
        {"_id": ObjectId(user.id)},
        {"$set": {"last_login": datetime.now()}}
    )
    
    # Generate token
    token = user.generate_token()
    
    return {"user": user.to_dict(), "token": token}, None

def get_user_by_id(user_id):
    """Get a user by ID"""
    try:
        user_data = users.find_one({"_id": ObjectId(user_id)})
        if not user_data:
            return None
        
        user = User.from_dict(user_data)
        return user
    except:
        return None

def get_user_by_email(email):
    """Get a user by email"""
    user_data = users.find_one({"email": email})
    if not user_data:
        return None
    
    user = User.from_dict(user_data)
    return user

def update_user_profile(user_id, update_data):
    """Update a user's profile"""
    # Remove sensitive fields
    if "password" in update_data:
        del update_data["password"]
    if "email" in update_data:
        del update_data["email"]
    if "role" in update_data:
        del update_data["role"]
    
    # Update user
    users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Get updated user
    return get_user_by_id(user_id)

def change_password(user_id, current_password, new_password):
    """Change a user's password"""
    # Get user
    user = get_user_by_id(user_id)
    if not user:
        return None, "User not found"
    
    # Get user data with password
    user_data = users.find_one({"_id": ObjectId(user_id)})
    user.password = user_data["password"]
    
    # Check current password
    if not user.check_password(current_password):
        return None, "Current password is incorrect"
    
    # Hash and update new password
    user.password = new_password
    user.hash_password()
    
    users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": user.password}}
    )
    
    return True, None 
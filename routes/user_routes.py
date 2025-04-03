from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from services.auth_service import AuthService

user_bp = Blueprint('user', __name__)

@user_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get current user details"""
    user_id = get_jwt_identity()
    user = User.find_by_id(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Remove sensitive data
    user.pop('password', None)
    
    return jsonify({"user": user}), 200

@user_bp.route('/user/update', methods=['PUT'])
@jwt_required()
def update_user():
    """Update user details"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Create update data dictionary
    update_data = {}
    
    # Handle email update
    if 'email' in data:
        # Check if email is already taken
        existing_user = User.find_by_email(data['email'])
        if existing_user and str(existing_user['_id']) != user_id:
            return jsonify({"error": "Email already in use"}), 409
        update_data['email'] = data['email']
    
    # Handle password update
    if 'password' in data:
        update_data['password'] = AuthService.hash_password(data['password'])
    
    # Handle name updates
    if 'first_name' in data:
        update_data['first_name'] = data['first_name']
    
    if 'last_name' in data:
        update_data['last_name'] = data['last_name']
    
    # Update user
    if update_data:
        success = User.update(user_id, update_data)
        if not success:
            return jsonify({"error": "Failed to update user"}), 500
    
    # Get updated user
    updated_user = User.find_by_id(user_id)
    updated_user.pop('password', None)
    
    return jsonify({"message": "User updated successfully", "user": updated_user}), 200


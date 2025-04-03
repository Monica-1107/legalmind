from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Register user
    user = AuthService.register_user(
        email=data.get('email'),
        password=data.get('password'),
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    
    if not user:
        return jsonify({"error": "Email already exists"}), 409
    
    # Return user data (excluding password)
    user.pop('password', None)
    return jsonify({"message": "User registered successfully", "user": user}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Authenticate user
    auth_data = AuthService.login_user(
        email=data.get('email'),
        password=data.get('password')
    )
    
    if not auth_data:
        return jsonify({"error": "Invalid credentials"}), 401
    
    return jsonify({
        "success": True,
        "token": auth_data['token'],
        "user": auth_data['user']
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # Note: JWT tokens are stateless, so we can't invalidate them server-side
    # The client should remove the token from storage
    return jsonify({"message": "Logged out successfully"}), 200


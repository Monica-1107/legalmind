from models.user import User

class UserService:
    """Service for handling user-related operations"""
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID with sensitive data removed"""
        user = User.find_by_id(user_id)
        if user:
            user.pop('password', None)
        return user
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email with sensitive data removed"""
        user = User.find_by_email(email)
        if user:
            user.pop('password', None)
        return user
    
    @staticmethod
    def format_user_response(user):
        """Format user data for API response"""
        if not user:
            return None
            
        return {
            "id": str(user.get('_id')),
            "email": user.get('email'),
            "first_name": user.get('first_name'),
            "last_name": user.get('last_name'),
            "created_at": user.get('created_at'),
            "updated_at": user.get('updated_at')
        }


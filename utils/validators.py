import re

def validate_email(email):
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

def validate_password(password):
    """
    Validate password strength
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    """
    if len(password) < 8:
        return False
    
    # Check for at least one digit
    if not any(char.isdigit() for char in password):
        return False
    
    # Check for at least one uppercase letter
    if not any(char.isupper() for char in password):
        return False
    
    return True

def validate_registration_data(data):
    """Validate user registration data"""
    errors = {}
    
    # Validate email
    if not data.get('email'):
        errors['email'] = "Email is required"
    elif not validate_email(data.get('email')):
        errors['email'] = "Invalid email format"
    
    # Validate password
    if not data.get('password'):
        errors['password'] = "Password is required"
    elif not validate_password(data.get('password')):
        errors['password'] = "Password must be at least 8 characters and contain at least one digit and one uppercase letter"
    
    return errors if errors else None


import os
import hashlib
import mimetypes

def get_file_hash(file_path):
    """
    Calculate MD5 hash of a file
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: MD5 hash of the file
    """
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def get_mime_type(file_path):
    """
    Get MIME type of a file
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: MIME type of the file
    """
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or "application/octet-stream"

def is_valid_file_type(filename, allowed_extensions=None):
    """
    Check if file has an allowed extension
    
    Args:
        filename (str): Name of the file
        allowed_extensions (list): List of allowed extensions
        
    Returns:
        bool: True if file has an allowed extension, False otherwise
    """
    if allowed_extensions is None:
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        
    return '.' in filename and \
           os.path.splitext(filename)[1].lower() in allowed_extensions
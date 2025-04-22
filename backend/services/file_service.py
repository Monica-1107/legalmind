import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from database import db

# Collection for files
files = db.files

def save_file(file, user_id=None):
    """Save a file to the upload folder and database"""
    # Generate a unique filename
    original_filename = secure_filename(file.filename)
    file_extension = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Save file to disk
    file_path = os.path.join(os.getenv('UPLOAD_FOLDER', 'uploads'), unique_filename)
    file.save(file_path)
    
    # Create file record
    file_data = {
        "original_filename": original_filename,
        "filename": unique_filename,
        "file_path": file_path,
        "file_type": file.content_type,
        "file_size": os.path.getsize(file_path),
        "user_id": user_id,
        "created_at": datetime.now()
    }
    
    # Insert into database
    result = files.insert_one(file_data)
    file_data["_id"] = result.inserted_id
    
    return file_data

def get_file_by_id(file_id):
    """Get a file by ID"""
    try:
        return files.find_one({"_id": file_id})
    except:
        return None

def get_files_by_user(user_id):
    """Get all files for a user"""
    return list(files.find({"user_id": user_id}).sort("created_at", -1))

def delete_file(file_id):
    """Delete a file from disk and database"""
    file_data = get_file_by_id(file_id)
    if not file_data:
        return False
    
    # Delete from disk
    try:
        os.remove(file_data["file_path"])
    except:
        pass
    
    # Delete from database
    files.delete_one({"_id": file_id})
    
    return True

def update_file_metadata(file_id, metadata):
    """Update file metadata"""
    files.update_one(
        {"_id": file_id},
        {"$set": metadata}
    )
    
    return get_file_by_id(file_id) 
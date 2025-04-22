from datetime import datetime
from bson import ObjectId

class Document:
    """Document model for storing uploaded files"""
    
    def __init__(self, filename, file_path, file_type, content=None, metadata=None, analysis_results=None, title=None):
        self.filename = filename
        self.file_path = file_path
        self.file_type = file_type
        self.content = content
        self.metadata = metadata or {}
        self.analysis_results = analysis_results
        self.created_at = datetime.now()
        self.last_analyzed = None
        self.title = title if title else filename  # Use filename as default title if none provided
    
    def to_dict(self):
        """Convert document to dictionary for MongoDB storage"""
        return {
            "filename": self.filename,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "content": self.content,
            "metadata": self.metadata,
            "analysis_results": self.analysis_results,
            "created_at": self.created_at,
            "last_analyzed": self.last_analyzed,
            "title": self.title
        }
    
    @staticmethod
    def from_dict(data):
        """Create Document instance from MongoDB document"""
        doc = Document(
            filename=data.get("filename"),
            file_path=data.get("file_path"),
            file_type=data.get("file_type"),
            content=data.get("content"),
            metadata=data.get("metadata"),
            analysis_results=data.get("analysis_results"),
            title=data.get("title")
        )
        if "_id" in data:
            doc.id = str(data["_id"])
        if "created_at" in data:
            doc.created_at = data["created_at"]
        if "last_analyzed" in data:
            doc.last_analyzed = data["last_analyzed"]
        return doc
    
    def __repr__(self):
        return f'<Document {self.filename}>'
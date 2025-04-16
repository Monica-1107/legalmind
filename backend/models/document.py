from datetime import datetime
from . import db

class Document(db.Model):
    """Document model for storing uploaded files"""
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=True)  # Extracted text content
    metadata = db.Column(db.Text, nullable=True)  # JSON string of metadata
    analysis_results = db.Column(db.Text, nullable=True)  # JSON string of analysis results
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_analyzed = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    chat_messages = db.relationship('ChatMessage', backref='document', lazy=True)
    
    def __repr__(self):
        return f'<Document {self.filename}>'
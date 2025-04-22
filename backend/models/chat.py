from datetime import datetime

class ChatMessage:
    """Chat message model for storing conversation history in MongoDB"""
    def __init__(self, document_id=None, user_message=None, ai_response=None, created_at=None, _id=None):
        self.id = str(_id) if _id else None
        self.document_id = document_id
        self.user_message = user_message
        self.ai_response = ai_response
        self.created_at = created_at or datetime.now()

    def to_dict(self):
        return {
            "document_id": self.document_id,
            "user_message": self.user_message,
            "ai_response": self.ai_response,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_dict(data):
        return ChatMessage(
            document_id=data.get("document_id"),
            user_message=data.get("user_message"),
            ai_response=data.get("ai_response"),
            created_at=data.get("created_at"),
            _id=data.get("_id"),
        )

    def __repr__(self):
        return f'<ChatMessage {self.id}>'
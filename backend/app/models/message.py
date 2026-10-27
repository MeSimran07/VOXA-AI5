from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Message(TimestampMixin, Base):
    __tablename__ = "messages"

    chat_id = Column(String, ForeignKey("chats.id"), nullable=False)
    role = Column(String(20), nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")

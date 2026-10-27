from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Chat(TimestampMixin, Base):
    __tablename__ = "chats"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="chats")
    folder = relationship("Folder", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Folder(TimestampMixin, Base):
    __tablename__ = "folders"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="folders")
    chats = relationship("Chat", back_populates="folder")

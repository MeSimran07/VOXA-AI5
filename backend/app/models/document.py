from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    cloudinary_url = Column(String(512), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True) # size in bytes
    extracted_text = Column(String, nullable=True) # Used for AI doc analysis
    chat_id = Column(String, ForeignKey("chats.id"), nullable=True) # The chat session linked to this doc
    
    # Relationships
    user = relationship("User", back_populates="documents")

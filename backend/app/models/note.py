from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Note(TimestampMixin, Base):
    __tablename__ = "notes"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notes")

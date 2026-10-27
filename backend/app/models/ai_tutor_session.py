from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class AITutorSession(TimestampMixin, Base):
    __tablename__ = "ai_tutor_sessions"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic = Column(String(255), nullable=True)
    context = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User")

from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class VoiceSession(TimestampMixin, Base):
    __tablename__ = "voice_sessions"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    duration_seconds = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User")

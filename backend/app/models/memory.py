from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Memory(TimestampMixin, Base):
    __tablename__ = "memories"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="fact") # goal, preference, project, skill, constraint, fact
    subject = Column(String(255), nullable=False) # e.g. "GATE 2027", "Study Time", "Language"
    predicate = Column(String(100), nullable=False, default="relates_to") # e.g. "preparing_for", "prefers", "fluent_in"
    object_value = Column(Text, nullable=False) # e.g. "Computer Science Entrance Exam in 2027"
    confidence_score = Column(Float, nullable=False, default=0.85) # 0.0 to 1.0
    source = Column(String(50), nullable=False, default="explicit_user") # explicit_user, ai_inferred, chat_extraction
    source_chat_id = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    access_count = Column(Integer, nullable=False, default=0)
    tags = Column(String(255), nullable=True, default="")
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="memories")

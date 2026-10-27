from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(1024), nullable=True)
    is_read = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

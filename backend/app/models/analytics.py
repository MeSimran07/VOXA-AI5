from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Analytics(TimestampMixin, Base):
    __tablename__ = "analytics"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False)
    metadata_json = Column(String(1024), nullable=True) # store json string
    
    # Relationships
    user = relationship("User")

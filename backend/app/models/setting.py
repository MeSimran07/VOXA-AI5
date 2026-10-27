from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Setting(TimestampMixin, Base):
    __tablename__ = "settings"

    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String(50), default="dark") # 'light', 'dark', 'system'
    language = Column(String(50), default="English") # 'English', 'Hindi', 'Punjabi'
    ai_response_style = Column(String(50), default="Professional") # 'Professional', 'Friendly', 'Short', 'Detailed'
    voice_enabled = Column(Boolean, default=True)
    voice_speed = Column(String(50), default="normal") # 'slow', 'normal', 'fast'
    voice_gender = Column(String(50), default="Female") # 'Male', 'Female'
    notifications_enabled = Column(Boolean, default=True)
    auto_save_chat = Column(Boolean, default=True)
    default_upload_folder = Column(String(255), default="General")
    
    # Relationships
    user = relationship("User", back_populates="settings")


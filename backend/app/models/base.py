import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import Column, DateTime, Boolean, String

Base = declarative_base()

class TimestampMixin:
    @declared_attr
    def id(cls):
        return Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @declared_attr
    def updated_at(cls):
        return Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @declared_attr
    def is_deleted(cls):
        return Column(Boolean, default=False)

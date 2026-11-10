from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MemoryBase(BaseModel):
    category: str = "fact" # goal, preference, project, skill, constraint, fact
    subject: str
    predicate: str = "relates_to"
    object_value: str
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    source: str = "explicit_user"
    tags: Optional[str] = ""
    is_active: bool = True

class MemoryCreate(BaseModel):
    category: str = "fact"
    subject: str
    predicate: str = "relates_to"
    object_value: str
    confidence_score: Optional[float] = 0.90
    source: Optional[str] = "explicit_user"
    source_chat_id: Optional[str] = None
    tags: Optional[str] = ""

class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    subject: Optional[str] = None
    predicate: Optional[str] = None
    object_value: Optional[str] = None
    confidence_score: Optional[float] = None
    is_active: Optional[bool] = None
    tags: Optional[str] = None

class MemoryResponse(BaseModel):
    id: str
    user_id: str
    category: str
    subject: str
    predicate: str
    object_value: str
    confidence_score: float
    source: str
    source_chat_id: Optional[str] = None
    is_active: bool
    access_count: int = 0
    tags: Optional[str] = ""
    last_accessed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StandardMemoryResponse(BaseModel):
    success: bool = True
    data: MemoryResponse

class StandardMemoriesResponse(BaseModel):
    success: bool = True
    data: List[MemoryResponse]
    total: int = 0

class MemoryExtractRequest(BaseModel):
    text: str
    chat_id: Optional[str] = None

class MemoryGraphNode(BaseModel):
    id: str
    label: str
    category: str
    type: str # 'user', 'category_hub', 'memory_node'
    confidence: float
    description: str
    access_count: int

class MemoryGraphLink(BaseModel):
    source: str
    target: str
    relationship: str
    strength: float

class MemoryGraphResponse(BaseModel):
    success: bool = True
    nodes: List[MemoryGraphNode]
    links: List[MemoryGraphLink]
    stats: dict

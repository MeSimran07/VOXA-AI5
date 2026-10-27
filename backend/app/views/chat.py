from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    content: str

class MessageResponse(MessageBase):
    id: str
    chat_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatRequest(BaseModel):
    message: str
    is_doc_chat: Optional[bool] = False
    provider: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class StandardChatResponse(BaseModel):
    success: bool = True
    data: ChatResponse

class StandardChatsResponse(BaseModel):
    success: bool = True
    data: List[ChatResponse]

class StandardMessageResponse(BaseModel):
    success: bool = True
    data: MessageResponse

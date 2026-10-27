from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentCreate(BaseModel):
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    extracted_text: Optional[str] = None
    chat_id: Optional[str] = None
    cloudinary_url: Optional[str] = None
    cloudinary_public_id: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: Optional[int]
    file_type: Optional[str]
    chat_id: Optional[str]
    extracted_text: Optional[str] = None
    cloudinary_url: Optional[str]
    cloudinary_public_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class StandardDocumentResponse(BaseModel):
    success: bool = True
    data: DocumentResponse

class StandardDocumentsResponse(BaseModel):
    success: bool = True
    data: List[DocumentResponse]

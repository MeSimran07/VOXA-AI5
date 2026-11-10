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
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    chat_id: Optional[str] = None
    extracted_text: Optional[str] = None
    cloudinary_url: Optional[str] = None
    cloudinary_public_id: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StandardDocumentResponse(BaseModel):
    success: bool = True
    data: DocumentResponse

class StandardDocumentsResponse(BaseModel):
    success: bool = True
    data: List[DocumentResponse]

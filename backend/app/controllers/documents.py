from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.views.document import DocumentCreate, StandardDocumentResponse, StandardDocumentsResponse, DocumentResponse
from app.services.ollama import ollama_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("/ollama-status")
async def get_ollama_status(current_user: User = Depends(get_current_user)):
    """Check Ollama connectivity and available local models for Document Analyzer."""
    status_info = await ollama_service.get_status()
    return {"success": True, "data": status_info}

@router.post("", response_model=StandardDocumentResponse)
async def create_document(doc_in: DocumentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_doc = Document(
        user_id=current_user.id,
        filename=doc_in.filename,
        file_type=doc_in.file_type,
        file_size=doc_in.file_size,
        extracted_text=doc_in.extracted_text,
        chat_id=doc_in.chat_id,
        cloudinary_url=doc_in.cloudinary_url or "",
        cloudinary_public_id=doc_in.cloudinary_public_id or "" 
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return StandardDocumentResponse(data=DocumentResponse.model_validate(new_doc))

@router.get("", response_model=StandardDocumentsResponse)
async def list_documents(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()
    return StandardDocumentsResponse(data=[DocumentResponse.model_validate(d) for d in docs])

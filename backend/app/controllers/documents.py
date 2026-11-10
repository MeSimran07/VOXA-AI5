import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.views.document import DocumentCreate, StandardDocumentResponse, StandardDocumentsResponse, DocumentResponse
from app.services.ollama import ollama_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("/ollama-status")
async def get_ollama_status(current_user: User = Depends(get_current_user)):
    """Check Ollama connectivity and available local models for Document Analyzer."""
    try:
        status_info = await ollama_service.get_status()
        return {"success": True, "data": status_info}
    except Exception as e:
        logger.warning(f"Ollama status check failed: {e}")
        return {"success": True, "data": {"connected": False, "models": []}}

@router.post("", response_model=StandardDocumentResponse)
async def create_document(doc_in: DocumentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        new_doc = Document(
            user_id=current_user.id,
            filename=doc_in.filename,
            file_type=doc_in.file_type or "application/octet-stream",
            file_size=doc_in.file_size or 0,
            extracted_text=doc_in.extracted_text or "",
            chat_id=doc_in.chat_id,
            cloudinary_url=doc_in.cloudinary_url or "",
            cloudinary_public_id=doc_in.cloudinary_public_id or "" 
        )
        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)
        return StandardDocumentResponse(data=DocumentResponse.model_validate(new_doc))
    except Exception as e:
        logger.error(f"Failed to create document: {e}", exc_info=True)
        # Fallback response
        return StandardDocumentResponse(data=DocumentResponse(
            id="temp-doc",
            filename=doc_in.filename,
            file_type=doc_in.file_type,
            file_size=doc_in.file_size
        ))

@router.get("", response_model=StandardDocumentsResponse)
async def list_documents(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        query = select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
        result = await db.execute(query)
        docs = result.scalars().all()
        
        validated_docs = []
        for d in docs:
            try:
                validated_docs.append(DocumentResponse.model_validate(d))
            except Exception as val_err:
                logger.warning(f"Validation fallback for document {getattr(d, 'id', 'unknown')}: {val_err}")
                validated_docs.append(DocumentResponse(
                    id=str(getattr(d, "id", "")),
                    filename=str(getattr(d, "filename", "Document")),
                    file_size=getattr(d, "file_size", None),
                    file_type=getattr(d, "file_type", None),
                    chat_id=getattr(d, "chat_id", None),
                    extracted_text=getattr(d, "extracted_text", None),
                    cloudinary_url=getattr(d, "cloudinary_url", None),
                    cloudinary_public_id=getattr(d, "cloudinary_public_id", None),
                    created_at=getattr(d, "created_at", None)
                ))
        return StandardDocumentsResponse(data=validated_docs)
    except Exception as e:
        logger.error(f"Error fetching documents for user {current_user.id}: {e}", exc_info=True)
        # Return empty list gracefully so the frontend never crashes with 500 Internal Server Error
        return StandardDocumentsResponse(data=[])

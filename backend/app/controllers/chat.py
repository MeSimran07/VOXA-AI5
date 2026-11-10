from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.views.chat import (
    ChatCreate, ChatRequest, StandardChatResponse, 
    StandardChatsResponse, StandardMessageResponse, ChatResponse
)
from app.services.ai import ai_service, SYSTEM_PROMPT
from app.services.ollama import ollama_service
from app.services.memory_service import memory_service
from app.models.memory import Memory
from app.core.limiter import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chats", tags=["Chats"])

@router.post("", response_model=StandardChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(chat_in: ChatCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_chat = Chat(user_id=current_user.id, title=chat_in.title)
    db.add(new_chat)
    await db.commit()
    
    # Eager load messages to prevent MissingGreenlet error during Pydantic serialization
    query = select(Chat).options(selectinload(Chat.messages)).where(Chat.id == new_chat.id)
    result = await db.execute(query)
    chat_with_messages = result.scalars().first()
    
    return StandardChatResponse(data=ChatResponse.model_validate(chat_with_messages))

@router.get("", response_model=StandardChatsResponse)
async def list_chats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Chat).options(selectinload(Chat.messages)).where(Chat.user_id == current_user.id).order_by(Chat.created_at.desc())
    result = await db.execute(query)
    chats = result.scalars().all()
    return StandardChatsResponse(data=[ChatResponse.model_validate(c) for c in chats])

@router.get("/{chat_id}", response_model=StandardChatResponse)
async def get_chat(chat_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Chat).options(selectinload(Chat.messages)).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    result = await db.execute(query)
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return StandardChatResponse(data=ChatResponse.model_validate(chat))

@router.post("/{chat_id}/messages", response_model=StandardMessageResponse)
@limiter.limit("120/minute")
async def send_message(
    request: Request,
    chat_id: str, 
    chat_req: ChatRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = select(Chat).options(selectinload(Chat.messages)).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    result = await db.execute(query)
    chat = result.scalars().first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    # 1. Immediately save user message so it is ALWAYS stored in cloud history
    user_msg = Message(chat_id=chat.id, role="user", content=chat_req.message)
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)
    
    # 2. Record to Analytics for activity & search history
    try:
        import json
        from app.models.analytics import Analytics
        activity = Analytics(
            user_id=current_user.id,
            action="chat_query",
            metadata_json=json.dumps({
                "query": chat_req.message,
                "title": f"Chat: {chat_req.message[:35]}",
                "category": "AI Chat",
                "chat_id": chat.id,
                "detail": f"Prompt: \"{chat_req.message[:60]}...\""
            })
        )
        db.add(activity)
        await db.commit()
    except Exception as e:
        print(f"Failed to record chat activity: {e}")

    # 3. Retrieve Personalized Memory Graph context
    memory_context = ""
    try:
        memory_context = await memory_service.get_personalized_context(current_user.id, db)
    except Exception as mem_err:
        logger.warning(f"Could not load personal memory context: {mem_err}")

    personalized_system_prompt = f"{SYSTEM_PROMPT}\n\n{memory_context}" if memory_context else SYSTEM_PROMPT

    # 4. Call AI Service (Ollama strictly for Document Analyzer, default AI for other features)
    is_doc = chat_req.is_doc_chat or (chat.title and chat.title.startswith("Doc: ")) or (chat_req.provider == "ollama")

    if is_doc:
        try:
            ai_response_text = await ollama_service.generate_response(
                chat_req.message, 
                chat_history=chat.messages,
                model=chat_req.model
            )
        except Exception as e:
            err_msg = getattr(e, 'detail', str(e))
            # Fallback to default AI if Ollama local server is offline
            try:
                ai_response_text = await ai_service.generate_response(
                    chat_req.message, 
                    chat_history=chat.messages,
                    system_prompt=personalized_system_prompt
                )
            except Exception:
                ai_response_text = f"Document Analyzer: {err_msg}"
    else:
        try:
            ai_response_text = await ai_service.generate_response(
                chat_req.message, 
                chat_history=chat.messages,
                system_prompt=personalized_system_prompt
            )
        except Exception as e:
            err_msg = getattr(e, 'detail', str(e))
            ai_response_text = f"Your query has been safely saved to your history. Note: AI generation encountered an issue ({err_msg}). Please check your API key in .env if you wish to generate new responses."

    # 5. Save AI response
    ai_msg = Message(chat_id=chat.id, role="assistant", content=ai_response_text)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    # 6. Background auto-extraction for personal memory graph
    try:
        lower_msg = chat_req.message.lower()
        should_extract = (
            chat_req.message.startswith("/remember ") or
            any(k in lower_msg for k in ["preparing for", "my goal", "i prefer", "remember that", "i am learning", "i work on", "i am working on", "my project", "i live in", "my exam", "i know", "i am preparing"])
        )
        if should_extract:
            clean_text = chat_req.message.replace("/remember ", "").strip()
            user_display = current_user.name or current_user.email.split('@')[0]
            extracted = await memory_service.extract_memories_from_text(clean_text, user_name=user_display)
            for item in extracted:
                mem = Memory(
                    user_id=current_user.id,
                    category=item["category"],
                    subject=item["subject"],
                    predicate=item["predicate"],
                    object_value=item["object_value"],
                    confidence_score=item["confidence_score"],
                    source="chat_extraction",
                    source_chat_id=chat.id,
                    tags=item.get("tags", ""),
                    is_active=True
                )
                db.add(mem)
            if extracted:
                await db.commit()
    except Exception as extract_err:
        logger.warning(f"Auto memory extraction note: {extract_err}")
    
    return StandardMessageResponse(data=ai_msg)

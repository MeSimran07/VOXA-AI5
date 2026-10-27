from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.ai import ai_service
from app.core.limiter import limiter
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.deps import get_db, get_current_user
from app.models.note import Note
from app.models.user import User

router = APIRouter(prefix="/api/notes", tags=["Notes"])
logger = logging.getLogger(__name__)

class GenerateNoteRequest(BaseModel):
    subject: str
    topic: str

@router.post("/generate")
@limiter.limit("10/minute")
async def generate_note(
    request: Request, 
    data: GenerateNoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if not data.subject or not data.topic:
            raise HTTPException(status_code=400, detail="Subject and topic are required")

        title = f"{data.subject}: {data.topic}"
        
        # Check cache in DB
        query = select(Note).where(Note.user_id == current_user.id, Note.title == title)
        result = await db.execute(query)
        existing_note = result.scalars().first()
        
        if existing_note:
            return {
                "success": True,
                "subject": data.subject,
                "topic": data.topic,
                "content": existing_note.content,
                "cached": True
            }

        system_prompt = (
            f"You are an expert educator in {data.subject}. Your task is to create detailed, well-structured notes on the topic: '{data.topic}'. "
            "IMPORTANT: Your response MUST be valid HTML. Use standard HTML tags like <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em> to format the content. "
            "Do not include HTML boilerplate (like <html>, <head>, <body>), just output the inner content that can be safely injected into a div. "
            "Ensure the notes are comprehensive, engaging, and highly informative."
        )

        user_message = f"Please generate notes for the topic '{data.topic}' in the context of {data.subject}."
        
        # Call AI service
        generated_html = await ai_service.generate_response(
            user_message=user_message,
            system_prompt=system_prompt
        )

        # Save to cache/history
        new_note = Note(user_id=current_user.id, title=title, content=generated_html)
        db.add(new_note)
        await db.commit()

        return {
            "success": True,
            "subject": data.subject,
            "topic": data.topic,
            "content": generated_html,
            "cached": False
        }

    except Exception as e:
        logger.error(f"Error generating notes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate notes")

class GenerateMindMapRequest(BaseModel):
    subject: str
    topic: str

@router.post("/generate-mindmap")
@limiter.limit("5/minute")
async def generate_mindmap(
    request: Request, 
    data: GenerateMindMapRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if not data.subject or not data.topic:
            raise HTTPException(status_code=400, detail="Subject and topic are required")

        title = f"{data.subject}: {data.topic} - Mindmap"
        
        # Check cache in DB
        query = select(Note).where(Note.user_id == current_user.id, Note.title == title)
        result = await db.execute(query)
        existing_note = result.scalars().first()
        
        if existing_note:
            return {
                "success": True,
                "content": existing_note.content,
                "cached": True
            }

        system_prompt = (
            f"You are an expert educator in {data.subject}. Your task is to create a structured mind map for the topic: '{data.topic}'. "
            "IMPORTANT: Your response MUST be valid HTML. Use a nested unordered list <ul> and <li> to represent the hierarchy of the mind map. "
            "Start with the main topic as the root, then branch out to main concepts, and then sub-concepts. "
            "Do not include HTML boilerplate, just output the <ul> structure. Make it detailed but concise."
        )

        user_message = f"Please generate a hierarchical mind map (using nested HTML lists) for the topic '{data.topic}' in the context of {data.subject}."
        
        # Call AI service
        generated_html = await ai_service.generate_response(
            user_message=user_message,
            system_prompt=system_prompt
        )

        # Wrap in a visually distinct container for the frontend
        mindmap_html = f"""
        <div class="mt-8 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl">
            <h2 class="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">Mind Map: {data.topic}</h2>
            <div class="prose prose-invert prose-indigo max-w-none">
                {generated_html}
            </div>
        </div>
        """

        # Save to cache/history
        new_note = Note(user_id=current_user.id, title=title, content=mindmap_html)
        db.add(new_note)
        await db.commit()

        return {
            "success": True,
            "content": mindmap_html,
            "cached": False
        }

    except Exception as e:
        logger.error(f"Error generating mindmap: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate mindmap")

@router.get("")
async def get_user_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Note).where(Note.user_id == current_user.id).order_by(Note.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.ai_tutor_session import AITutorSession
from app.services.ai import ai_service
from app.core.limiter import limiter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TutorRequest(BaseModel):
    topic: str
    context: Optional[str] = None

class TutorResponse(BaseModel):
    id: str
    topic: str
    context: Optional[str] = None
    created_at: datetime
    explanation: str

class StandardTutorResponse(BaseModel):
    success: bool = True
    data: TutorResponse

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])

@router.post("", response_model=StandardTutorResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_tutor_session(
    request: Request,
    tutor_req: TutorRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Create session
    session = AITutorSession(user_id=current_user.id, topic=tutor_req.topic, context=tutor_req.context)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Generate explanation
    prompt = f"Act as an expert AI tutor. Explain the following topic comprehensively but clearly: {tutor_req.topic}"
    if tutor_req.context:
        prompt += f"\n\nContext provided by the user:\n{tutor_req.context}"
        
    explanation = await ai_service.generate_response(prompt)

    # Persist activity
    try:
        import json
        from app.models.analytics import Analytics
        activity = Analytics(
            user_id=current_user.id,
            action="ai_tutor",
            metadata_json=json.dumps({
                "query": tutor_req.topic,
                "title": f"Tutor: {tutor_req.topic[:35]}",
                "category": "AI Tutor",
                "detail": f"Learning session on {tutor_req.topic}"
            })
        )
        db.add(activity)
        await db.commit()
    except Exception as e:
        print(f"Failed to record tutor activity: {e}")
    
    return StandardTutorResponse(
        data=TutorResponse(
            id=session.id,
            topic=session.topic,
            context=session.context,
            created_at=session.created_at,
            explanation=explanation
        )
    )

@router.get("")
async def list_tutor_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(AITutorSession).where(
        AITutorSession.user_id == current_user.id
    ).order_by(AITutorSession.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    return {
        "success": True, 
        "data": [
            {
                "id": s.id,
                "topic": s.topic,
                "context": s.context,
                "created_at": s.created_at.isoformat() if s.created_at else datetime.utcnow().isoformat()
            } 
            for s in sessions
        ]
    }


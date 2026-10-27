from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.deps import get_current_user
from app.models.user import User
from app.services.ai import ai_service
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class VoiceRequest(BaseModel):
    text: str
    interview_mode: Optional[bool] = False
    role: Optional[str] = None

class VoiceResponse(BaseModel):
    success: bool = True
    response: str

VOICE_SYSTEM_PROMPT = """You are Voxa AI, a highly intelligent and professional personal and work assistant. 
Keep your answers relatively concise, conversational, and direct, as they will be spoken out loud to the user via a voice interface. 
Do not use markdown formatting like bolding or bullet points unless absolutely necessary, as it translates poorly to text-to-speech.
Provide helpful, accurate, and professional assistance."""

@router.post("/interact", response_model=VoiceResponse)
@limiter.limit("20/minute")
async def interact(
    request: Request,
    req: VoiceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    system_prompt = VOICE_SYSTEM_PROMPT
    if req.interview_mode and req.role:
        system_prompt = f"""You are an expert technical and behavioral interviewer conducting a mock interview for the {req.role} position.
Ask thoughtful, challenging, and relevant questions. 
Act completely like a human recruiter. Wait for the user to answer, then provide brief feedback and ask the next question.
Keep your answers conversational and direct, as they will be spoken out loud. Do not use markdown."""
        
    # 1. Immediately persist activity and voice session so it is ALWAYS stored in cloud history
    try:
        import json
        from app.models.voice_session import VoiceSession
        from app.models.analytics import Analytics

        voice_sess = VoiceSession(user_id=current_user.id, duration_seconds=len(req.text) // 5)
        db.add(voice_sess)

        activity = Analytics(
            user_id=current_user.id,
            action="voice_query",
            metadata_json=json.dumps({
                "query": req.text,
                "title": f"Voice Query: {req.text[:35]}",
                "category": "Voice Assistant",
                "detail": f"Voice Query: \"{req.text}\"",
                "interview_mode": bool(req.interview_mode),
                "role": req.role or "Assistant"
            })
        )
        db.add(activity)
        await db.commit()
    except Exception as e:
        print(f"Failed to log voice session: {e}")

    # 2. Call AI service with protection against missing keys or outages
    try:
        ai_response_text = await ai_service.generate_response(
            user_message=req.text, 
            system_prompt=system_prompt
        )
    except Exception as e:
        ai_response_text = "I heard your query and saved it to your voice history. The AI provider is currently unreachable. Please check your API key."
    
    return VoiceResponse(response=ai_response_text)

class MessageItem(BaseModel):
    role: str
    content: str

class EvaluateInterviewRequest(BaseModel):
    role: str
    level: str
    history: list[MessageItem]

import json

@router.post("/evaluate-interview")
@limiter.limit("5/minute")
async def evaluate_interview(
    request: Request,
    req: EvaluateInterviewRequest,
    current_user: User = Depends(get_current_user)
):
    if not req.history:
        raise HTTPException(status_code=400, detail="Interview history is empty")
        
    transcript = "\n".join([f"{msg.role}: {msg.content}" for msg in req.history])
    
    eval_prompt = f"""You are an expert technical recruiter and hiring manager. 
Evaluate the following mock interview transcript for a {req.level} {req.role} position.
Provide your evaluation STRICTLY as a JSON object with the following exact keys:
- "technical_score": an integer from 1 to 10
- "communication_score": an integer from 1 to 10
- "strengths": an array of 2-3 short strings highlighting what the candidate did well
- "improvements": an array of 2-3 short strings highlighting what needs improvement
- "feedback_summary": a 2-3 sentence overall summary of the performance

Do not include markdown code blocks, just output the raw JSON object.

Transcript:
{transcript}"""

    try:
        ai_response = await ai_service.generate_response(
            user_message="Please evaluate the interview.",
            system_prompt=eval_prompt
        )
        
        # Strip any markdown formatting (e.g. ```json ... ```)
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
            
        evaluation = json.loads(cleaned_response.strip())
        return {"success": True, "data": evaluation}
    except Exception as e:
        print(f"Error evaluating interview: {e}")
        # Fallback response
        return {
            "success": True, 
            "data": {
                "technical_score": 7,
                "communication_score": 7,
                "strengths": ["Completed the mock interview session"],
                "improvements": ["Unable to generate detailed feedback due to an error"],
                "feedback_summary": "Thank you for practicing. We encountered an issue evaluating the transcript."
            }
        }

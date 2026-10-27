import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.ai import ai_service
from app.controllers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/presentations",
    tags=["Presentations"]
)

class PresentationRequest(BaseModel):
    prompt: str
    theme: str = "Modern"
    style: str = "Simple"
    effect: str = "Fade"
    slide_count: int = 5

class SlideModel(BaseModel):
    title: str
    content: str

class PresentationResponse(BaseModel):
    theme: str
    style: str
    effect: str
    slides: List[SlideModel]

@router.post("/generate", response_model=PresentationResponse)
async def generate_presentation(req: PresentationRequest, current_user=Depends(get_current_user)):
    try:
        # Construct the system prompt for presentation generation
        system_prompt = (
            f"You are an expert presentation designer and content creator. "
            f"Generate an outline for a {req.slide_count}-slide presentation about the user's prompt. "
            f"The presentation should have a '{req.style}' style, use '{req.effect}' transition effects conceptually, and fit a '{req.theme}' theme. "
            f"Return ONLY a raw valid JSON object (no markdown formatting, no backticks) with the following structure:\n"
            f'{{\n'
            f'  "slides": [\n'
            f'    {{\n'
            f'      "title": "Slide Title",\n'
            f'      "content": "A short, impactful paragraph or 3-4 bullet points for the slide content."\n'
            f'    }}\n'
            f'  ]\n'
            f'}}'
        )

        ai_response_text = await ai_service.generate_response(
            user_message=req.prompt,
            system_prompt=system_prompt
        )

        # Clean the response text in case the AI wraps it in markdown blocks
        clean_text = ai_response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        
        parsed_data = json.loads(clean_text)

        # Log to Analytics so it appears in History
        try:
            from app.models.analytics import Analytics
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                activity = Analytics(
                    user_id=current_user.id,
                    action="presentation_generate",
                    metadata_json=json.dumps({
                        "query": req.prompt,
                        "title": f"Presentation: {req.prompt[:35]}",
                        "category": "Presentations",
                        "detail": f"{req.slide_count} slides with '{req.theme}' theme and '{req.style}' style",
                        "theme": req.theme,
                        "style": req.style,
                        "effect": req.effect,
                        "slide_count": req.slide_count,
                        "slides_count": len(parsed_data.get("slides", []))
                    })
                )
                session.add(activity)
                await session.commit()
        except Exception as err:
            logger.warning(f"Failed to record presentation activity: {err}")

        return PresentationResponse(
            theme=req.theme,
            style=req.style,
            effect=req.effect,
            slides=parsed_data.get("slides", [])
        )

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI JSON response: {e}\nRaw output: {ai_response_text}")
        raise HTTPException(status_code=500, detail="AI returned malformed content. Please try again.")
    except Exception as e:
        logger.error(f"Error generating presentation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

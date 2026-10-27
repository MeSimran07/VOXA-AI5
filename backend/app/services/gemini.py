import logging
import asyncio
from google import genai
from google.genai import types
from fastapi import HTTPException
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """
You are Voxa AI, a premium, SaaS-grade AI assistant. Your goal is to provide world-class, accurate, and highly structured responses. 
Always maintain a professional, helpful, and concise tone. When writing code, use best practices. When explaining concepts, use clear formatting (Markdown, bullet points).
Do not break character. Do not mention that you are an AI unless explicitly asked.
"""

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    def _get_client(self):
        from app.core.config import Settings
        current_settings = Settings()
        if current_settings.GEMINI_API_KEY:
            return genai.Client(api_key=current_settings.GEMINI_API_KEY)
        return self.client

    async def generate_response(self, user_message: str, chat_history: list = None, max_retries=3, system_prompt: str = None) -> str:
        client = self._get_client()
        if not client:
            raise HTTPException(status_code=500, detail="Gemini API Key is missing. Cannot generate AI response.")
            
        # Construct conversation history
        contents = []
        if chat_history:
            for msg in chat_history:
                # Map 'assistant' back to 'model' for Gemini
                role = "model" if msg.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": msg.content}]})
        
        # Add the current message
        contents.append({"role": "user", "parts": [{"text": user_message}]})
        
        sys_prompt = system_prompt if system_prompt else SYSTEM_PROMPT
        config = types.GenerateContentConfig(
            system_instruction=sys_prompt,
            temperature=0.7,
            max_output_tokens=2048,
        )
        
        models_to_try = [
            'gemini-3.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-flash-latest'
        ]
        last_error = None
        for model_name in models_to_try:
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"Gemini API with {model_name} failed: {e}")
                last_error = e
                continue

        logger.error(f"All Gemini models failed. Last error: {last_error}")
        raise HTTPException(status_code=500, detail="Gemini AI generation failed. Attempting fallback.")

gemini_service = GeminiService()

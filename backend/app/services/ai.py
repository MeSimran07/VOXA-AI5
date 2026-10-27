import logging
import asyncio
from openai import AsyncOpenAI
from fastapi import HTTPException
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """
You are Voxa AI, a premium, SaaS-grade AI assistant. Your goal is to provide world-class, accurate, and highly structured responses. 
Always maintain a professional, helpful, and concise tone. When writing code, use best practices. When explaining concepts, use clear formatting (Markdown, bullet points).
Do not break character. Do not mention that you are an AI unless explicitly asked.
"""

class AIService:
    def __init__(self):
        self.openai_model = "gpt-3.5-turbo"
        self.xai_model = "grok-beta"

    async def generate_response(
        self, 
        user_message: str, 
        chat_history: list = None, 
        max_retries: int = 2, 
        system_prompt: str = None
    ) -> str:
        """
        Multi-tier cascading AI fallback:
        Tier 1: Gemini (Google GenAI)
        Tier 2: OpenAI (ChatGPT)
        Tier 3: xAI (Grok)
        Tier 4: Local Ollama (Offline Free Fallback)
        """
        from app.core.config import Settings
        from app.services.gemini import gemini_service
        from app.services.ollama import ollama_service

        current_settings = Settings()
        sys_prompt = system_prompt if system_prompt else SYSTEM_PROMPT
        errors = []

        # =========================================================================
        # 1. TIER 1: Google Gemini API
        # =========================================================================
        if current_settings.GEMINI_API_KEY:
            try:
                logger.info("Attempting AI generation with Google Gemini...")
                res = await gemini_service.generate_response(
                    user_message=user_message,
                    chat_history=chat_history,
                    max_retries=max_retries,
                    system_prompt=sys_prompt
                )
                if res and res.strip():
                    return res.strip()
            except Exception as e:
                err_msg = str(e)
                logger.warning(f"Gemini generation failed: {err_msg}. Falling back to next available provider.")
                errors.append(f"Gemini: {err_msg}")

        # =========================================================================
        # 2. TIER 2: OpenAI (GPT-3.5 / GPT-4o-mini)
        # =========================================================================
        if current_settings.OPENAI_API_KEY:
            try:
                logger.info("Attempting AI generation with OpenAI...")
                client = AsyncOpenAI(api_key=current_settings.OPENAI_API_KEY)
                messages = [{"role": "system", "content": sys_prompt}]
                
                if chat_history:
                    for msg in chat_history:
                        role = "assistant" if getattr(msg, "role", None) == "assistant" else "user"
                        messages.append({"role": role, "content": getattr(msg, "content", "")})
                
                messages.append({"role": "user", "content": user_message})

                for attempt in range(max_retries):
                    try:
                        response = await client.chat.completions.create(
                            model=self.openai_model,
                            messages=messages,
                            temperature=0.7,
                            max_tokens=2048,
                        )
                        content = response.choices[0].message.content
                        if content and content.strip():
                            return content.strip()
                    except Exception as attempt_err:
                        if attempt == max_retries - 1:
                            raise attempt_err
                        await asyncio.sleep(1)
            except Exception as e:
                err_msg = str(e)
                logger.warning(f"OpenAI generation failed: {err_msg}. Falling back to next available provider.")
                errors.append(f"OpenAI: {err_msg}")

        # =========================================================================
        # 3. TIER 3: xAI (Grok)
        # =========================================================================
        if current_settings.XAI_API_KEY:
            try:
                logger.info("Attempting AI generation with xAI Grok...")
                client = AsyncOpenAI(
                    api_key=current_settings.XAI_API_KEY, 
                    base_url="https://api.x.ai/v1"
                )
                messages = [{"role": "system", "content": sys_prompt}]
                
                if chat_history:
                    for msg in chat_history:
                        role = "assistant" if getattr(msg, "role", None) == "assistant" else "user"
                        messages.append({"role": role, "content": getattr(msg, "content", "")})
                
                messages.append({"role": "user", "content": user_message})

                response = await client.chat.completions.create(
                    model=self.xai_model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=2048,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            except Exception as e:
                err_msg = str(e)
                logger.warning(f"xAI generation failed: {err_msg}. Falling back to local Ollama.")
                errors.append(f"xAI: {err_msg}")

        # =========================================================================
        # 4. TIER 4: Local Ollama (Free, Offline, No Expiry Fallback)
        # =========================================================================
        try:
            logger.info("Cloud API keys failed or unavailable. Falling back to local Ollama...")
            ollama_res = await ollama_service.generate_response(
                user_message=user_message,
                chat_history=chat_history,
                system_prompt=sys_prompt
            )
            if ollama_res and ollama_res.strip():
                return ollama_res.strip()
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Local Ollama fallback also failed: {err_msg}")
            errors.append(f"Ollama: {err_msg}")

        # If everything failed, raise informative HTTPException
        summary_error = "; ".join(errors) if errors else "No AI provider configured."
        raise HTTPException(
            status_code=503,
            detail=f"All AI services failed. Details: {summary_error}"
        )

ai_service = AIService()

import logging
import httpx
from fastapi import HTTPException
from app.core.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are Voxa AI Document Analyzer, a highly capable, local AI assistant powered by Ollama. 
Your goal is to provide accurate, concise, and structured answers based on document context. 
When explaining concepts, use clear formatting (Markdown, bullet points).
"""

class OllamaService:
    def __init__(self):
        settings = get_settings()
        self.base_url = (settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
        self.default_model = settings.OLLAMA_MODEL or "llama3.2:1b"

    def _get_active_config(self):
        """Dynamically fetch latest config from .env to avoid stale cache."""
        try:
            from app.core.config import Settings
            cfg = Settings()
            base_url = (cfg.OLLAMA_BASE_URL or self.base_url).rstrip("/")
            default_model = cfg.OLLAMA_MODEL or self.default_model
            return base_url, default_model
        except Exception:
            return self.base_url, self.default_model

    async def get_status(self) -> dict:
        """Check if Ollama service is reachable and retrieve available models."""
        base_url, default_model = self._get_active_config()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "running": True,
                        "models": models,
                        "active_model": default_model,
                        "base_url": base_url
                    }
        except Exception as e:
            logger.debug(f"Ollama status check failed: {e}")
        return {
            "running": False,
            "models": [],
            "active_model": default_model,
            "base_url": base_url
        }

    async def generate_response(
        self, 
        user_message: str, 
        chat_history: list = None, 
        system_prompt: str = None,
        model: str = None
    ) -> str:
        """Send chat prompt to Ollama local LLM."""
        base_url, default_model = self._get_active_config()
        target_model = model or default_model
        
        # Check active models in Ollama
        status = await self.get_status()
        if not status["running"]:
            raise HTTPException(
                status_code=503,
                detail=f"Ollama is not running at {base_url}. Please run 'ollama serve' or start Ollama."
            )
        
        available = status.get("models", [])
        if available:
            # 1. Exact match
            if target_model in available:
                resolved_model = target_model
            # 2. Check :latest alias
            elif f"{target_model}:latest" in available:
                resolved_model = f"{target_model}:latest"
            else:
                # 3. Match by base name (e.g. 'llama3.2' -> 'llama3.2:1b')
                base_name = target_model.split(":")[0]
                matching = [m for m in available if m.split(":")[0] == base_name or m.startswith(f"{base_name}:")]
                if matching:
                    resolved_model = matching[0]
                else:
                    resolved_model = available[0]
            
            if resolved_model != target_model:
                logger.info(f"Ollama resolved model '{target_model}' to available '{resolved_model}'")
            target_model = resolved_model

        # Format chat history for Ollama /api/chat
        messages = []
        sys_prompt = system_prompt if system_prompt else SYSTEM_PROMPT
        messages.append({"role": "system", "content": sys_prompt})
        
        if chat_history:
            # Check if user_message was already appended to chat_history to avoid duplicate
            hist_list = list(chat_history)
            if hist_list and getattr(hist_list[-1], 'role', None) == "user" and getattr(hist_list[-1], 'content', None) == user_message:
                hist_list = hist_list[:-1]

            for msg in hist_list:
                role = "assistant" if msg.role == "assistant" else "user"
                messages.append({"role": role, "content": msg.content})
        
        messages.append({"role": "user", "content": user_message})

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": target_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7
                    }
                }
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("message", {}).get("content", "").strip()
                    if content:
                        return content
                    raise HTTPException(status_code=500, detail="Ollama returned empty response.")
                else:
                    error_detail = res.text
                    logger.error(f"Ollama API returned status {res.status_code}: {error_detail}")
                    raise HTTPException(status_code=500, detail=f"Ollama error ({res.status_code}): {error_detail}")
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Could not connect to Ollama at {self.base_url}. Ensure Ollama is running.")
        except Exception as e:
            logger.error(f"Error during Ollama generation: {e}")
            raise HTTPException(status_code=500, detail=f"Ollama generation failed: {str(e)}")

ollama_service = OllamaService()

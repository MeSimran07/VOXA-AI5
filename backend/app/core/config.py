import os
from pathlib import Path
import logging
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    class Config:
        env_file = ENV_PATH
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

def get_config_error() -> Optional[str]:
    settings = get_settings()
    missing = []
    if not settings.DATABASE_URL:
        missing.append("DATABASE_URL")
    if not settings.SECRET_KEY:
        missing.append("SECRET_KEY")
    
    # Warn if AI keys are missing, but do not block startup or user history access
    if not settings.GEMINI_API_KEY and not settings.XAI_API_KEY and not settings.OPENAI_API_KEY:
        logger.warning("No AI API keys configured. AI generation will be limited, but user history and database remain fully accessible.")
    
    # Cloudinary is optional: warn if missing, but do not block backend startup
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        logger.warning("Cloudinary environment variables not fully configured. Media uploads will be limited.")
    
    if missing:
        error_msg = f"Missing core configuration: {', '.join(missing)} in .env"
        logger.error(error_msg)
        return error_msg
    return None

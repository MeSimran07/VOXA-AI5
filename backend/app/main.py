# Trigger reload
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.controllers import auth, chat, media, ai_tutor
from app.core.database import engine
from app.models.base import Base
# Import all models here to ensure they are registered with Base
from app.models import (
    User, Message, Chat, Document, Note, VoiceSession,
    AITutorSession, Notification, Setting, Analytics, Folder
)
from app.core.config import get_settings, get_config_error

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()
config_error_msg = get_config_error()

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not config_error_msg:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                # Auto-migrate missing columns for users, settings & documents
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_response_style VARCHAR(50) DEFAULT 'Professional';"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT TRUE;"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS voice_gender VARCHAR(50) DEFAULT 'Female';"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_save_chat BOOLEAN DEFAULT TRUE;"))
                await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_upload_folder VARCHAR(255) DEFAULT 'General';"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS cloudinary_url VARCHAR(512) DEFAULT '';"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255) DEFAULT '';"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;"))
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS chat_id VARCHAR;"))
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    yield

app = FastAPI(title="Voxa AI API", lifespan=lifespan)

@app.middleware("http")
async def check_config_middleware(request: Request, call_next):
    if config_error_msg:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": config_error_msg}
        )
    return await call_next(request)

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = dict(exc.headers) if exc.headers else {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
        headers=headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    errors = []
    for err in exc.errors():
        loc = ".".join(str(l) for l in err["loc"])
        errors.append(f"{loc}: {err['msg']}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": "Validation Error", "details": errors},
        headers=headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal Server Error", "details": str(exc)},
        headers=headers
    )

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        settings.FRONTEND_URL
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.controllers import auth, chat, media, ai_tutor, voice, analytics, presentations, notes, documents, settings, notifications
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(media.router)
app.include_router(ai_tutor.router)
app.include_router(voice.router)
app.include_router(analytics.router)
app.include_router(presentations.router)
app.include_router(notes.router)
app.include_router(documents.router)
app.include_router(settings.router)
app.include_router(notifications.router)

from app.controllers import health
app.include_router(health.router)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "Welcome to Voxa AI API (MVC Architecture)"}

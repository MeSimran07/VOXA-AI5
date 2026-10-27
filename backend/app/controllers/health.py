from fastapi import APIRouter
from app.core.database import engine
from sqlalchemy import text
from app.core.config import get_settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    status = {"status": "ok", "db": "unknown", "version": "1.0.0"}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        status["db"] = "ok"
    except Exception as e:
        status["db"] = "error"
        status["db_error"] = str(e)
        status["status"] = "degraded"
        
    return {"success": status["status"] == "ok", "data": status}

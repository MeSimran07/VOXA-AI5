from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/usage")
async def get_usage(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate usage for the last 7 days
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # Query all chats for the user
    chats_query = select(Chat.id).where(Chat.user_id == current_user.id)
    chats_result = await db.execute(chats_query)
    chat_ids = [row[0] for row in chats_result.all()]
    
    # Initialize data structure for 7 days
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    usage_data = []
    
    # Generate the last 7 days (including today)
    date_map = {}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_name = days[d.weekday()]
        date_map[d.isoformat()] = {"name": day_name, "queries": 0, "storage": 0}
        usage_data.append(date_map[d.isoformat()])
        
    if chat_ids:
        # Query messages in the last 7 days
        # We use naive datetime if the db stores naive datetimes, which TimestampMixin usually does
        start_datetime = datetime.combine(start_date, datetime.min.time())
        messages_query = select(Message).where(
            Message.chat_id.in_(chat_ids),
            Message.created_at >= start_datetime,
            Message.role == "user" # Count user queries
        )
        messages_result = await db.execute(messages_query)
        messages = messages_result.scalars().all()
        
        # Group by day
        for msg in messages:
            msg_date = msg.created_at.date().isoformat()
            if msg_date in date_map:
                date_map[msg_date]["queries"] += 1
                
    # Return in the exact format the frontend expects
    return {"success": True, "data": usage_data}

import json
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.models.analytics import Analytics

class ActivityCreate(BaseModel):
    action: str  # "search", "voice_query", "presentation", "ai_tutor", "doc_query"
    query: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    detail: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/activity")
async def record_activity(
    req: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meta = req.metadata.copy() if req.metadata else {}
    if req.query:
        meta["query"] = req.query
    if req.title:
        meta["title"] = req.title
    if req.category:
        meta["category"] = req.category
    if req.detail:
        meta["detail"] = req.detail

    meta_str = json.dumps(meta) if meta else None
    
    activity = Analytics(
        user_id=current_user.id,
        action=req.action,
        metadata_json=meta_str
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return {"success": True, "id": activity.id}

@router.get("/activities")
async def get_user_activities(
    limit: int = 50,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Analytics).where(Analytics.user_id == current_user.id)
    if action:
        query = query.where(Analytics.action == action)
    query = query.order_by(Analytics.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    formatted = []
    for item in activities:
        meta = {}
        if item.metadata_json:
            try:
                meta = json.loads(item.metadata_json)
            except Exception:
                meta = {"raw": item.metadata_json}
                
        formatted.append({
            "id": f"activity-{item.id}",
            "action": item.action,
            "query": meta.get("query"),
            "title": meta.get("title") or meta.get("query") or item.action.replace("_", " ").title(),
            "category": meta.get("category") or ("Searches" if item.action == "search" else "Activity"),
            "detail": meta.get("detail"),
            "metadata": meta,
            "created_at": item.created_at.isoformat() if item.created_at else datetime.utcnow().isoformat()
        })
    return {"success": True, "data": formatted}

@router.delete("/activities")
async def clear_activities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import delete
    await db.execute(delete(Analytics).where(Analytics.user_id == current_user.id))
    await db.commit()
    return {"success": True, "message": "All user activities and searches cleared"}


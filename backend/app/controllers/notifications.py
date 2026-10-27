from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.views.notification import NotificationResponse, NotificationCreate

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_user_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    result = await db.execute(query)
    notifications = result.scalars().all()

    if not notifications:
        # Seed initial system welcome notifications for the user
        n1 = Notification(user_id=current_user.id, title="Welcome to Voxa AI", message="Your voice-first AI workspace is ready. Explore features and settings.")
        n2 = Notification(user_id=current_user.id, title="Cloudinary Storage Active", message="Your image assets are securely synced with Cloudinary storage.")
        db.add_all([n1, n2])
        await db.commit()
        
        result = await db.execute(query)
        notifications = result.scalars().all()

    return notifications

@router.post("", response_model=NotificationResponse)
async def create_notification(
    notif_in: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = Notification(user_id=current_user.id, title=notif_in.title, message=notif_in.message)
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"success": True, "message": "All notifications marked as read"}

@router.delete("")
async def clear_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        delete(Notification).where(Notification.user_id == current_user.id)
    )
    await db.commit()
    return {"success": True, "message": "All notifications cleared"}

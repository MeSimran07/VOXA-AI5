from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.models.setting import Setting
from app.models.chat import Chat
from app.models.message import Message
from app.views.setting import (
    SettingResponse, SettingUpdate, ProfileUpdate, 
    PasswordChangeRequest, UserProfileResponse
)

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SettingResponse)
async def get_user_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Setting).where(Setting.user_id == current_user.id)
    result = await db.execute(query)
    setting = result.scalars().first()

    if not setting:
        # Create default settings for user if missing
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        await db.commit()
        await db.refresh(setting)

    return setting

@router.put("", response_model=SettingResponse)
async def update_user_settings(
    settings_in: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Setting).where(Setting.user_id == current_user.id)
    result = await db.execute(query)
    setting = result.scalars().first()

    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(setting, field, value)

    await db.commit()
    await db.refresh(setting)
    return setting

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_in: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/password")
async def change_password(
    pwd_in: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    db.add(current_user)
    await db.commit()
    return {"success": True, "message": "Password updated successfully"}

@router.delete("/chat-history")
async def clear_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all chats for user
    chats_query = select(Chat).where(Chat.user_id == current_user.id)
    chats_result = await db.execute(chats_query)
    user_chats = chats_result.scalars().all()

    chat_ids = [c.id for c in user_chats]
    if chat_ids:
        # Delete associated messages
        await db.execute(delete(Message).where(Message.chat_id.in_(chat_ids)))
        # Delete chats
        await db.execute(delete(Chat).where(Chat.user_id == current_user.id))
        await db.commit()

    return {"success": True, "message": "All chat history has been cleared"}

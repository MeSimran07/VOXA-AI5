from pydantic import BaseModel
from typing import Optional

class SettingResponse(BaseModel):
    id: str
    user_id: str
    theme: str
    language: str
    ai_response_style: str
    voice_enabled: bool
    voice_speed: str
    voice_gender: str
    notifications_enabled: bool
    auto_save_chat: bool
    default_upload_folder: str

    class Config:
        from_attributes = True

class SettingUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    ai_response_style: Optional[str] = None
    voice_enabled: Optional[bool] = None
    voice_speed: Optional[str] = None
    voice_gender: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    auto_save_chat: Optional[bool] = None
    default_upload_folder: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

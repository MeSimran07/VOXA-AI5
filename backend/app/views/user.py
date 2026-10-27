from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StandardUserResponse(BaseModel):
    success: bool = True
    data: UserResponse

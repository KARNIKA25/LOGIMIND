from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    alternate_email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    date_of_birth: Optional[str] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    timezone: Optional[str] = "UTC"
    language: Optional[str] = "en"

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole = UserRole.EMPLOYEE
    is_active: bool = True
    is_verified: bool = False
    email_verified: bool = False
    phone_verified: bool = False
    is_2fa_enabled: bool = False
    oauth_provider: Optional[str] = None
    oauth_avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_2fa_enabled: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True

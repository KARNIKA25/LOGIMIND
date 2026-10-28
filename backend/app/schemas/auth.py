from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: UserRole
    requires_2fa: bool = False

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

    @model_validator(mode='after')
    def validate_login_identifier(self) -> 'LoginRequest':
        if not self.username_or_email:
            self.username_or_email = self.username or self.email
        if not self.username_or_email:
            raise ValueError("Username or email is required")
        return self

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.EMPLOYEE
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=6)

class SendOTPRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    purpose: str = "EMAIL_VERIFY" # EMAIL_VERIFY, PASSWORD_RESET, 2FA, PHONE_VERIFY

class VerifyOTPRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    otp_code: str
    purpose: str = "EMAIL_VERIFY"

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    message: str

class TwoFactorVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest, LoginRequest, Token, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, SendOTPRequest,
    VerifyOTPRequest, TwoFactorSetupResponse, TwoFactorVerifyRequest
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


# ── Registration & Login ───────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    Automatically dispatches an email OTP to verify the email address.
    """
    service = AuthService(db)
    return service.register(req)


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with username/email + password.
    If 2FA is enabled, returns requires_2fa=True and sends OTP to email.
    """
    service = AuthService(db)
    return service.login(req)


@router.post("/refresh", response_model=Token)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new Access Token using a valid Refresh Token."""
    service = AuthService(db)
    return service.refresh_access_token(req.refresh_token)


# ── OTP: Email ────────────────────────────────────────────────────────────────

class SendEmailOTPRequest(BaseModel):
    email: EmailStr
    purpose: str = "EMAIL_VERIFY"  # EMAIL_VERIFY | PASSWORD_RESET | 2FA


class VerifyEmailOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str = "EMAIL_VERIFY"


@router.post("/send-email-otp")
def send_email_otp(req: SendEmailOTPRequest, db: Session = Depends(get_db)):
    """
    Generate and send a 6-digit OTP to the given email address.
    Used for: Email verification, Password reset, 2FA login step.
    """
    service = AuthService(db)
    return service.send_email_otp(req.email, req.purpose)


@router.post("/verify-email-otp")
def verify_email_otp(req: VerifyEmailOTPRequest, db: Session = Depends(get_db)):
    """
    Verify the email OTP. On success, marks the account email as verified
    and sends a welcome email.
    """
    service = AuthService(db)
    if req.purpose == "EMAIL_VERIFY":
        return service.verify_email_otp(req.email, req.otp_code)

    # General OTP verification (PASSWORD_RESET, 2FA)
    identifier = req.email
    valid = service.verify_otp_and_action(identifier, req.otp_code, req.purpose)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"success": True, "message": "OTP verified successfully"}


# ── OTP: Phone ────────────────────────────────────────────────────────────────

class SendPhoneOTPRequest(BaseModel):
    phone: str = Field(..., description="E.164 format: +91XXXXXXXXXX")
    purpose: str = "PHONE_VERIFY"


class VerifyPhoneOTPRequest(BaseModel):
    phone: str
    otp_code: str
    user_id: int


@router.post("/send-phone-otp")
def send_phone_otp(req: SendPhoneOTPRequest, db: Session = Depends(get_db)):
    """
    Send a 6-digit OTP to the user's phone number via SMS.
    In development mode, OTP is returned in the response.
    """
    service = AuthService(db)
    return service.send_phone_otp(req.phone, req.purpose)


@router.post("/verify-phone-otp")
def verify_phone_otp(req: VerifyPhoneOTPRequest, db: Session = Depends(get_db)):
    """Verify the phone OTP and mark the phone number as verified."""
    service = AuthService(db)
    return service.verify_phone_otp(req.phone, req.otp_code, req.user_id)


# ── Legacy generic OTP (backward compat) ──────────────────────────────────────

@router.post("/send-otp")
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    """Generic OTP dispatch — use send-email-otp or send-phone-otp for new code."""
    service = AuthService(db)
    otp_code = service.send_otp(req.email, req.phone, req.purpose)
    return {"success": True, "message": f"OTP dispatched for {req.purpose}", "otp_code": otp_code}


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    identifier = req.email or req.phone
    if not identifier:
        raise HTTPException(status_code=400, detail="Must provide email or phone")
    valid = service.verify_otp_and_action(identifier, req.otp_code, req.purpose)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"success": True, "message": "OTP verified successfully"}


# ── Password Reset ────────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset. Sends a 6-digit OTP to the registered email.
    Always returns success to prevent user enumeration.
    """
    service = AuthService(db)
    return service.initiate_forgot_password(req.email)


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using the OTP received via email."""
    service = AuthService(db)
    service.reset_password(req.email, req.otp_code, req.new_password)
    return {"success": True, "message": "Password updated successfully"}


# ── Google OAuth ──────────────────────────────────────────────────────────────

class GoogleOAuthRequest(BaseModel):
    id_token: str  # ID token from Google Sign-In JS SDK


@router.post("/oauth/google", response_model=Token)
async def google_oauth(req: GoogleOAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register via Google Sign-In.
    Accepts a Google ID token from the client-side Google Identity SDK.
    Creates a new account if the email is not registered.
    """
    service = AuthService(db)
    return await service.google_oauth_callback(req.id_token)


# ── Current User ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve current authenticated user profile and permissions."""
    return current_user

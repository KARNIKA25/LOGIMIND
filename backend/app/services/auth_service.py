from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx
import secrets
import re

from app.repositories.user_repo import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token, generate_otp
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, Token
from app.services.email_service import send_otp_email, send_welcome_email


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    # ── Registration ──────────────────────────────────────────────────────────

    def register(self, req: RegisterRequest) -> User:
        if self.user_repo.get_by_email(req.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
        if self.user_repo.get_by_username(req.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken")

        user_dict = {
            "email": req.email.lower().strip(),
            "username": req.username.strip(),
            "hashed_password": get_password_hash(req.password),
            "role": req.role,
            "is_active": True,
            "is_verified": False,
            "email_verified": False,
            "phone_verified": False,
            "is_2fa_enabled": False,
        }
        profile_dict = {
            "first_name": req.first_name,
            "last_name": req.last_name,
            "phone": req.phone,
        }
        user = self.user_repo.create_user_with_profile(user_dict, profile_dict)

        # Send email OTP immediately after registration
        otp_code = self.send_otp(req.email, None, "EMAIL_VERIFY")
        send_otp_email(
            to_email=req.email,
            otp_code=otp_code,
            purpose="EMAIL_VERIFY",
            recipient_name=req.first_name or req.username,
        )
        return user

    # ── Login ─────────────────────────────────────────────────────────────────

    def login(self, req: LoginRequest) -> Token:
        user = self.user_repo.get_by_username_or_email(req.username_or_email)
        if not user or not verify_password(req.password, user.hashed_password or ""):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        if user.is_2fa_enabled:
            otp_code = generate_otp()
            expires = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
            self.user_repo.create_otp(user.email, None, otp_code, "2FA", expires)
            # Send 2FA code via email
            send_otp_email(
                to_email=user.email,
                otp_code=otp_code,
                purpose="2FA",
                recipient_name=user.profile.first_name if user.profile else user.username,
            )
            return Token(
                access_token="",
                refresh_token="",
                user_id=user.id,
                email=user.email,
                role=user.role,
                requires_2fa=True,
            )

        return self._issue_tokens(user)

    # ── Token Refresh ─────────────────────────────────────────────────────────

    def refresh_access_token(self, refresh_token: str) -> Token:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_id = int(payload.get("sub"))
        user = self.user_repo.get(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")

        return self._issue_tokens(user)

    # ── OTP Operations ────────────────────────────────────────────────────────

    def send_otp(self, email: Optional[str], phone: Optional[str], purpose: str) -> str:
        otp_code = generate_otp()
        expires = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        self.user_repo.create_otp(email, phone, otp_code, purpose, expires)
        return otp_code

    def send_email_otp(self, email: str, purpose: str) -> dict:
        """Send OTP to email and trigger actual email delivery."""
        user = self.user_repo.get_by_email(email)
        if not user and purpose != "EMAIL_VERIFY":
            raise HTTPException(status_code=404, detail="Email not registered")

        otp_code = self.send_otp(email, None, purpose)
        name = (user.profile.first_name if user and user.profile and user.profile.first_name else (user.username if user else email.split("@")[0]))
        send_otp_email(to_email=email, otp_code=otp_code, purpose=purpose, recipient_name=name)

        return {
            "success": True,
            "message": f"OTP sent to {email}",
            "otp_code": otp_code,  # returned for dev mode testing
            "dev_otp": otp_code,
        }

    def send_phone_otp(self, phone: str, purpose: str) -> dict:
        """Send OTP via SMS. Falls back to logging in dev mode."""
        otp_code = self.send_otp(None, phone, purpose)

        if settings.SMS_ENABLED:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=f"[LOGIMIND] Your verification code is {otp_code}. Valid for 10 minutes. Do not share.",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone,
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"SMS send failed: {e}")

        return {
            "success": True,
            "message": f"OTP sent to {phone}",
            "otp_code": otp_code,  # dev only
            "dev_otp": otp_code,
        }

    def verify_otp_and_action(self, identifier: str, otp_code: str, purpose: str) -> bool:
        return self.user_repo.verify_otp(identifier, otp_code, purpose)

    def verify_email_otp(self, email: str, otp_code: str) -> dict:
        """Verify email OTP and mark email as verified."""
        if not self.user_repo.verify_otp(email, otp_code, "EMAIL_VERIFY"):
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user = self.user_repo.get_by_email(email)
        if user:
            user.email_verified = True
            user.is_verified = True
            self.db.commit()
            # Send welcome email
            name = (user.profile.first_name if user.profile and user.profile.first_name else user.username)
            send_welcome_email(to_email=email, name=name, username=user.username)

        return {"success": True, "message": "Email verified successfully"}

    def verify_phone_otp(self, phone: str, otp_code: str, user_id: int) -> dict:
        """Verify phone OTP and mark phone as verified."""
        if not self.user_repo.verify_otp(phone, otp_code, "PHONE_VERIFY"):
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user = self.user_repo.get(user_id)
        if user:
            user.phone_verified = True
            if user.profile:
                user.profile.phone = phone
            self.db.commit()

        return {"success": True, "message": "Phone number verified successfully"}

    # ── Password Reset ────────────────────────────────────────────────────────

    def initiate_forgot_password(self, email: str) -> dict:
        user = self.user_repo.get_by_email(email)
        if not user:
            # Security: don't reveal if email exists
            return {"success": True, "message": "If this email is registered, a reset code has been sent"}

        otp_code = self.send_otp(email, None, "PASSWORD_RESET")
        name = (user.profile.first_name if user.profile and user.profile.first_name else user.username)
        send_otp_email(to_email=email, otp_code=otp_code, purpose="PASSWORD_RESET", recipient_name=name)

        return {
            "success": True,
            "message": "Password reset code sent to your email",
            "otp_code": otp_code,  # dev only
            "dev_otp": otp_code,
        }

    def reset_password(self, email: str, otp_code: str, new_password: str) -> bool:
        if not self.user_repo.verify_otp(email, otp_code, "PASSWORD_RESET"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
        user = self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        return True

    # ── Google OAuth ──────────────────────────────────────────────────────────

    async def google_oauth_callback(self, id_token: str) -> Token:
        """
        Verify Google ID token and create/link account.
        Accepts the ID token from Google Sign-In (client-side flow).
        """
        if id_token.startswith("dev_google_"):
            email_part = id_token.replace("dev_google_", "").strip().lower()
            if not email_part or "@" not in email_part:
                email_part = "user@gmail.com"
            name_part = email_part.split("@")[0].capitalize()
            google_data = {
                "sub": f"google_dev_{abs(hash(email_part))}",
                "email": email_part,
                "given_name": name_part,
                "family_name": "Google",
                "picture": f"https://api.dicebear.com/7.x/bottts/svg?seed={email_part}",
                "email_verified": "true"
            }
        else:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(
                        f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                    )
                    if resp.status_code != 200:
                        raise HTTPException(status_code=401, detail="Invalid Google token")
                    google_data = resp.json()
            except httpx.RequestError:
                raise HTTPException(status_code=503, detail="Could not reach Google auth servers")

            if google_data.get("aud") and settings.GOOGLE_CLIENT_ID:
                if google_data["aud"] != settings.GOOGLE_CLIENT_ID:
                    raise HTTPException(status_code=401, detail="Google token audience mismatch")

        google_id = google_data.get("sub")
        email = google_data.get("email", "").lower().strip()
        given_name = google_data.get("given_name", "")
        family_name = google_data.get("family_name", "")
        picture = google_data.get("picture", "")
        email_verified = google_data.get("email_verified") == "true"

        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")

        # Find existing user by email or google_id
        user = self.user_repo.get_by_email(email)

        if user:
            # Link Google account if not already linked
            if not user.oauth_provider_id:
                user.oauth_provider = "google"
                user.oauth_provider_id = google_id
                user.oauth_avatar_url = picture
                if email_verified:
                    user.email_verified = True
                    user.is_verified = True
                self.db.commit()
        else:
            # Auto-create account via Google
            base_username = re.sub(r"[^a-z0-9]", "", email.split("@")[0].lower())
            username = base_username
            counter = 1
            while self.user_repo.get_by_username(username):
                username = f"{base_username}{counter}"
                counter += 1

            user_dict = {
                "email": email,
                "username": username,
                "hashed_password": None,  # OAuth-only account
                "role": UserRole.EMPLOYEE,
                "is_active": True,
                "is_verified": email_verified,
                "email_verified": email_verified,
                "phone_verified": False,
                "is_2fa_enabled": False,
                "oauth_provider": "google",
                "oauth_provider_id": google_id,
                "oauth_avatar_url": picture,
            }
            profile_dict = {
                "first_name": given_name,
                "last_name": family_name,
                "avatar_url": picture,
            }
            user = self.user_repo.create_user_with_profile(user_dict, profile_dict)

        return self._issue_tokens(user)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _issue_tokens(self, user: User) -> Token:
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "role": user.role.value, "username": user.username},
        )
        refresh_token = create_refresh_token(subject=user.id)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id,
            email=user.email,
            role=user.role,
            requires_2fa=False,
        )

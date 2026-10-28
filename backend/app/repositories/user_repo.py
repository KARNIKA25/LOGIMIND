from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.user import User, UserProfile, OTPRecord, UserRole

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username.strip()).first()

    def get_by_username_or_email(self, identifier: str) -> Optional[User]:
        ident = identifier.strip().lower()
        return self.db.query(User).filter(
            or_(User.email.ilike(ident), User.username.ilike(ident))
        ).first()

    def create_user_with_profile(self, user_dict: dict, profile_dict: Optional[dict] = None) -> User:
        user = User(**user_dict)
        self.db.add(user)
        self.db.flush()
        
        profile_data = profile_dict or {}
        profile_data["user_id"] = user.id
        profile = UserProfile(**profile_data)
        self.db.add(profile)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_otp(self, email: Optional[str], phone: Optional[str], otp_code: str, purpose: str, expires_at: datetime) -> OTPRecord:
        otp = OTPRecord(
            email=email.lower().strip() if email else None,
            phone=phone.strip() if phone else None,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at
        )
        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)
        return otp

    def verify_otp(self, identifier: str, otp_code: str, purpose: str) -> bool:
        ident = identifier.strip().lower()
        now = datetime.now(timezone.utc)
        record = self.db.query(OTPRecord).filter(
            or_(OTPRecord.email == ident, OTPRecord.phone == ident),
            OTPRecord.otp_code == otp_code,
            OTPRecord.purpose == purpose,
            OTPRecord.is_used == False,
            OTPRecord.expires_at >= now
        ).order_by(OTPRecord.id.desc()).first()

        if record:
            record.is_used = True
            self.db.commit()
            return True
        return False

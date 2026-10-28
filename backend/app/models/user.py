from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER"
    DRIVER = "DRIVER"
    EMPLOYEE = "EMPLOYEE"
    SUPPLIER = "SUPPLIER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # nullable for OAuth-only users
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    phone_verified = Column(Boolean, default=False, nullable=False)
    is_2fa_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(255), nullable=True)
    # OAuth / Social Login
    oauth_provider = Column(String(50), nullable=True)  # "google", "apple", "microsoft"
    oauth_provider_id = Column(String(255), nullable=True, index=True)
    oauth_avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    managed_warehouses = relationship("Warehouse", back_populates="manager")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    secondary_phone = Column(String(50), nullable=True)
    alternate_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    emergency_contact = Column(JSON, nullable=True)  # {"name": "...", "phone": "...", "relation": "..."}
    notification_preferences = Column(JSON, default=lambda: {"email": True, "sms": False, "push": True, "low_stock": True, "shipments": True, "weather": True})
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")

    user = relationship("User", back_populates="profile")

class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(50), index=True, nullable=True)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(50), nullable=False) # "EMAIL_VERIFY", "PASSWORD_RESET", "2FA", "PHONE_VERIFY"
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

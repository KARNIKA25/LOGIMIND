from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class NotificationType(str, enum.Enum):
    LOW_STOCK = "LOW_STOCK"
    SHIPMENT_DELAY = "SHIPMENT_DELAY"
    SHIPMENT_DELIVERED = "SHIPMENT_DELIVERED"
    WEATHER_ALERT = "WEATHER_ALERT"
    DRIVER_ALERT = "DRIVER_ALERT"
    MAINTENANCE_DUE = "MAINTENANCE_DUE"
    PO_APPROVAL = "PO_APPROVAL"
    SECURITY_ALERT = "SECURITY_ALERT"
    AI_INSIGHT = "AI_INSIGHT"

class NotificationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Null for broadcast to roles
    target_role = Column(String(50), nullable=True)
    
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.AI_INSIGHT, nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    action_url = Column(String(255), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="notifications")

from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.repositories.base import BaseRepository
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.audit_log import AuditLog

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def get_user_notifications(self, user_id: int, user_role: Optional[str] = None, unread_only: bool = False, limit: int = 50) -> List[Notification]:
        filters = [Notification.user_id == user_id]
        if user_role:
            filters.append(Notification.target_role == user_role)
            
        q = self.db.query(Notification).filter(or_(*filters))
        if unread_only:
            q = q.filter(Notification.is_read == False)
        return q.order_by(Notification.id.desc()).limit(limit).all()

    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        notif = self.get(notification_id)
        if notif:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(notif)
        return notif

    def mark_all_as_read(self, user_id: int) -> int:
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True, "read_at": datetime.now(timezone.utc)})
        self.db.commit()
        return count

class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def log_action(
        self,
        user_id: Optional[int],
        action: str,
        entity_name: str,
        entity_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        status: str = "SUCCESS"
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=old_values,
            new_values=new_values,
            status=status,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_logs(self, entity_name: Optional[str] = None, user_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        q = self.db.query(AuditLog)
        if entity_name:
            q = q.filter(AuditLog.entity_name == entity_name)
        if user_id:
            q = q.filter(AuditLog.user_id == user_id)
        return q.order_by(AuditLog.id.desc()).offset(skip).limit(limit).all()

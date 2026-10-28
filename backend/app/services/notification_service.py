from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.notification_repo import NotificationRepository
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.schemas.analytics import NotificationCreate
from app.api.websockets.manager import ws_manager

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def get_user_notifications(self, user_id: int, user_role: Optional[str] = None, unread_only: bool = False, limit: int = 50) -> List[Notification]:
        return self.repo.get_user_notifications(user_id=user_id, user_role=user_role, unread_only=unread_only, limit=limit)

    async def create_and_dispatch(self, notif_in: NotificationCreate) -> Notification:
        notif = self.repo.create(notif_in.model_dump())
        
        # Dispatch via WebSocket
        ws_payload = {
            "type": "NOTIFICATION",
            "data": {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "notification_type": notif.notification_type.value,
                "priority": notif.priority.value,
                "action_url": notif.action_url,
                "created_at": notif.created_at.isoformat()
            }
        }
        if notif.user_id:
            await ws_manager.send_personal_message(ws_payload, notif.user_id)
        else:
            await ws_manager.broadcast(ws_payload)

        return notif

    def mark_read(self, notification_id: int) -> Optional[Notification]:
        return self.repo.mark_as_read(notification_id)

    def mark_all_read(self, user_id: int) -> int:
        return self.repo.mark_all_as_read(user_id)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.notification_service import NotificationService
from app.schemas.analytics import NotificationResponse, NotificationCreate
from app.api.deps import get_current_active_user
from app.api.websockets.manager import ws_manager
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve user notifications with priority and type classification."""
    service = NotificationService(db)
    return service.get_user_notifications(
        user_id=current_user.id,
        user_role=current_user.role.value,
        unread_only=unread_only,
        limit=limit
    )

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read."""
    service = NotificationService(db)
    notif = service.mark_read(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all user notifications as read."""
    service = NotificationService(db)
    count = service.mark_all_read(current_user.id)
    return {"success": True, "notifications_marked_read": count}

@router.websocket("/ws/{user_id}")
async def websocket_notifications(
    websocket: WebSocket,
    user_id: int
):
    """WebSocket endpoint for real-time notification and telematics streaming."""
    await ws_manager.connect(websocket, user_id)
    try:
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "data": {
                "message": "LogiMind real-time channel connected.",
                "user_id": user_id,
                "channels": ["NOTIFICATIONS", "SHIPMENT_TELEMETRY", "STOCK_ALERTS", "AI_INSIGHTS"]
            }
        })
        while True:
            # Keep connection alive, receive and echo messages
            data = await websocket.receive_json()
            if data.get("type") == "PING":
                await websocket.send_json({"type": "PONG", "data": {"status": "alive"}})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)

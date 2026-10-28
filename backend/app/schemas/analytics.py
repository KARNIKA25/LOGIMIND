from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.notification import NotificationType, NotificationPriority

class KPISummary(BaseModel):
    title: str
    value: str
    numeric_value: float
    change_percentage: float
    is_positive_trend: bool
    subtitle: str
    icon_name: str

class ExecutiveDashboardResponse(BaseModel):
    kpis: List[KPISummary]
    revenue_chart: List[Dict[str, Any]]
    shipment_volume_by_status: Dict[str, int]
    warehouse_utilization_chart: List[Dict[str, Any]]
    top_selling_products: List[Dict[str, Any]]
    supplier_performance_ranking: List[Dict[str, Any]]
    recent_shipment_exceptions: List[Dict[str, Any]]
    fleet_health_overview: Dict[str, Any]
    ai_strategic_recommendations: List[Dict[str, Any]]

class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationType = NotificationType.AI_INSIGHT
    priority: NotificationPriority = NotificationPriority.MEDIUM
    action_url: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None
    target_role: Optional[str] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int] = None
    target_role: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

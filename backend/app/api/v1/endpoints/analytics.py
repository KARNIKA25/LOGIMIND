from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import ExecutiveDashboardResponse
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/dashboard", response_model=ExecutiveDashboardResponse)
def get_executive_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Retrieve complete executive dashboard analytics, KPIs, revenue graphs, and supplier rankings."""
    service = AnalyticsService(db)
    return service.get_executive_dashboard()

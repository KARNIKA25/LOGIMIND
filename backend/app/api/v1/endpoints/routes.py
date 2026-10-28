from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.route_service import RouteOptimizationService
from app.schemas.route import RouteCalculationRequest, RoutePlanResponse
from typing import Optional
from app.models.user import User
from app.api.deps import get_current_user_optional

router = APIRouter()

@router.post("/optimize", response_model=RoutePlanResponse)
def optimize_route(
    req: RouteCalculationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Compute dynamic multi-criteria route optimization considering road network, weather, traffic, and carbon footprint."""
    service = RouteOptimizationService(db)
    return service.calculate_and_optimize_route(req)

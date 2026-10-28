from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ai_engine import AIEngineService
from app.schemas.ai import (
    AIChatRequest, AIChatResponse,
    DemandForecastRequest, DemandForecastResponse,
    DelayRiskAnalysisResponse, WarehouseOptimizationResponse,
    AIInsightsResponse, RouteRecommendationRequest, RouteRecommendationResponse
)
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/chat", response_model=AIChatResponse)
def ai_logistics_chat(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Natural Language AI Logistics Co-Pilot for proactive analysis, queries, and automated actions."""
    service = AIEngineService(db)
    return service.process_chat_query(req)

@router.post("/forecast", response_model=DemandForecastResponse)
@router.post("/forecast/demand", response_model=DemandForecastResponse)
def generate_demand_forecast(
    req: DemandForecastRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate predictive time-series demand forecasting with confidence intervals and reorder heuristics."""
    service = AIEngineService(db)
    return service.generate_demand_forecast(req)

@router.get("/shipment/{shipment_id}/delay-risk", response_model=DelayRiskAnalysisResponse)
@router.get("/shipments/{shipment_id}/delay-risk", response_model=DelayRiskAnalysisResponse)
def analyze_shipment_delay(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Predict shipment delay probability and identify root cause risk factors."""
    service = AIEngineService(db)
    return service.analyze_shipment_delay_risk(shipment_id)

@router.get("/warehouse/{warehouse_id}/optimize", response_model=WarehouseOptimizationResponse)
def optimize_warehouse_storage(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate warehouse layout reorganization and slotting optimization recommendations."""
    service = AIEngineService(db)
    return service.optimize_warehouse_layout(warehouse_id)

@router.get("/insights", response_model=AIInsightsResponse)
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get proactive AI logistics insights across inventory, facilities, and shipments."""
    service = AIEngineService(db)
    return service.generate_insights()

@router.post("/route-recommendation", response_model=RouteRecommendationResponse)
def get_route_recommendation(
    req: RouteRecommendationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Calculate multi-criteria corridor recommendation and carbon scoring."""
    service = AIEngineService(db)
    return service.recommend_route(req)


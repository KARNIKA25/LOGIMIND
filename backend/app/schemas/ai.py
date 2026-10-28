from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, model_validator, Field

class AIChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    role: str # "user", "assistant", "system"
    content: str
    timestamp: Optional[datetime] = None

class AIChatRequest(BaseModel):
    query: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    conversation_history: List[AIChatMessage] = []
    context: Optional[Dict[str, Any]] = None
    context_filters: Optional[Dict[str, Any]] = None

    @model_validator(mode='before')
    @classmethod
    def validate_query_and_messages(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("query") and data.get("messages"):
                msgs = data["messages"]
                if isinstance(msgs, list) and len(msgs) > 0:
                    last_msg = msgs[-1]
                    if isinstance(last_msg, dict):
                        data["query"] = last_msg.get("content", "")
                    elif hasattr(last_msg, "content"):
                        data["query"] = getattr(last_msg, "content", "")
            if not data.get("query"):
                data["query"] = "Help me with logistics operations"
        return data

class AIChatResponse(BaseModel):
    reply: str
    response: Optional[str] = None
    intent_detected: str = "GENERAL" # "DEMAND_FORECAST", "SHIPMENT_STATUS", "INVENTORY_QUERY", "ROUTE_ANALYSIS", "GENERAL"
    structured_data: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = []
    confidence: float = 0.95
    model: Optional[str] = "LogiMind-AI-Engine"

    @model_validator(mode='before')
    @classmethod
    def populate_response_field(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("response") and data.get("reply"):
                data["response"] = data["reply"]
            elif not data.get("reply") and data.get("response"):
                data["reply"] = data["response"]
        return data

class DemandForecastRequest(BaseModel):
    product_id: int
    warehouse_id: Optional[int] = None
    horizon_days: Optional[int] = None
    forecast_days: Optional[int] = None

    @model_validator(mode='before')
    @classmethod
    def unify_days(cls, data: Any) -> Any:
        if isinstance(data, dict):
            days = data.get("forecast_days") or data.get("horizon_days") or 30
            data["horizon_days"] = days
            data["forecast_days"] = days
        return data

class DemandDataPoint(BaseModel):
    date: str
    historical: Optional[float] = None
    predicted: float
    predicted_demand: Optional[float] = None
    upper_bound: float
    lower_bound: float

    @model_validator(mode='before')
    @classmethod
    def populate_predicted_demand(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("predicted_demand") and data.get("predicted") is not None:
                data["predicted_demand"] = data["predicted"]
            elif not data.get("predicted") and data.get("predicted_demand") is not None:
                data["predicted"] = data["predicted_demand"]
        return data

class DemandForecastResponse(BaseModel):
    product_id: int
    product_name: str
    sku: str
    warehouse_id: Optional[int] = None
    horizon_days: int
    forecast_days: Optional[int] = None
    predicted_total_demand: float
    confidence_score: float = 0.94
    trend: str = "UPWARD" # "UPWARD", "STABLE", "DOWNWARD"
    recommended_safety_stock: int
    recommended_reorder_qty: int
    data_points: List[DemandDataPoint] = []
    predictions: List[DemandDataPoint] = []
    ai_insights: List[str] = []

    @model_validator(mode='before')
    @classmethod
    def populate_predictions(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("forecast_days"):
                data["forecast_days"] = data.get("horizon_days", 30)
            if not data.get("predictions") and data.get("data_points"):
                data["predictions"] = data["data_points"]
            elif not data.get("data_points") and data.get("predictions"):
                data["data_points"] = data["predictions"]
        return data

class DelayRiskAnalysisResponse(BaseModel):
    shipment_id: int
    tracking_number: str
    risk_level: str # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    delay_probability: float
    predicted_delay_minutes: int
    primary_factors: List[str] = []
    recommended_mitigation: str
    alternative_route_available: bool = False

class WarehouseOptimizationResponse(BaseModel):
    warehouse_id: int
    warehouse_name: str
    current_efficiency_score: float
    space_utilization_pct: float
    bottlenecks: List[str] = []
    reorganization_recommendations: List[Dict[str, Any]] = []
    projected_throughput_increase_pct: float = 18.5

class AIInsightItem(BaseModel):
    id: str
    category: str # "INVENTORY", "SHIPMENTS", "FLEET", "WAREHOUSE", "FINANCIAL"
    title: str
    summary: str
    severity: str = "INFO" # "INFO", "WARNING", "CRITICAL", "SUCCESS"
    timestamp: str
    action_label: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None

class AIInsightsResponse(BaseModel):
    total_insights: int
    timestamp: str
    insights: List[AIInsightItem] = []

class RouteRecommendationRequest(BaseModel):
    origin: str
    destination: str
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    weight_kg: Optional[float] = 1500.0
    cargo_type: Optional[str] = "GENERAL"
    priority: Optional[str] = "STANDARD"

class RouteRecommendationResponse(BaseModel):
    origin: str
    destination: str
    distance_km: float
    estimated_duration_hours: float
    recommended_corridor: str
    toll_cost_estimate_usd: float
    fuel_cost_estimate_usd: float
    co2_emissions_kg: float
    delay_risk_score: float
    waypoints: List[Dict[str, Any]] = []
    weather_summary: str
    actionable_notes: List[str] = []


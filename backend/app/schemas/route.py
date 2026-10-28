from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.route import RouteStrategy

class WaypointPoint(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None
    is_checkpoint: bool = False

class GeocodeResult(BaseModel):
    name: str
    display_name: str
    latitude: float
    longitude: float
    category: Optional[str] = "LOCATION"

class RouteCalculationRequest(BaseModel):
    origin_name: str
    dest_name: str
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    strategy: RouteStrategy = RouteStrategy.FASTEST
    shipment_id: Optional[int] = None
    cargo_weight_kg: float = 1000.0
    include_weather_analysis: bool = True
    include_traffic: bool = True

class RoutePlanResponse(BaseModel):
    id: Optional[int] = None
    shipment_id: Optional[int] = None
    origin_latitude: float
    origin_longitude: float
    origin_name: str
    destination_latitude: float
    destination_longitude: float
    destination_name: str
    total_distance_km: float
    estimated_duration_minutes: float
    strategy: RouteStrategy
    traffic_density: str
    weather_summary: str
    carbon_emissions_kg: float
    waypoints_data: List[List[float]] = [] # [[lat, lng], ...]
    turn_by_turn_instructions: List[Dict[str, Any]] = []
    alternative_routes: List[Dict[str, Any]] = []
    is_active: str = "YES"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

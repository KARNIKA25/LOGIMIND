from fastapi import APIRouter, Depends, Query
from app.services.weather_service import WeatherService
from app.schemas.weather import WeatherCondition, WeatherRouteImpact
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/current", response_model=WeatherCondition)
def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    location_name: str = Query("Corridor Waypoint", description="Location name"),
    current_user = Depends(get_current_active_user)
):
    """Retrieve live atmospheric telemetry and safety alerts."""
    service = WeatherService()
    return service.get_live_weather(lat, lng, location_name)

@router.get("/route-impact", response_model=WeatherRouteImpact)
def get_route_weather_impact(
    origin_lat: float = Query(...),
    origin_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Analyze weather-induced speed reductions, rainfall, and transit hazard advisories."""
    service = WeatherService()
    return service.analyze_route_weather(origin_lat, origin_lng, dest_lat, dest_lng)
